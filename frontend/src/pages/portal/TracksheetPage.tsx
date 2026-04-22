import React, { useState, useEffect, useCallback } from 'react'
import './tracksheet.scss'
import dayjs, { type Dayjs } from 'dayjs'
import * as XLSX from 'xlsx'
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tooltip, Pagination,
} from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import {
  Pencil, Trash2, Plus, Info, Eye, BarChart2, AlertCircle,
  Loader2, Download, Send, CalendarDays, List, FileSpreadsheet,
  Lock, Clock, CheckCircle2, XCircle,
} from 'lucide-react'
import TimesheetDrawer from '@/components/timesheet/TimesheetDrawer'
import TimesheetCalendar from '@/components/timesheet/TimesheetCalendar'
import SubmitToClientDrawer from '@/components/timesheet/SubmitToClientDrawer'
import ViewEntryModal from '@/components/timesheet/ViewEntryModal'
import { useToast } from '@/context/ToastContext'
import { generateTimesheetCSV, getTimesheetFilename } from '@/lib/csv'
import type { TimesheetEntry } from '@/types/timesheet'
import {
  getTimesheets,
  getSubmissions,
  deleteTimesheet,
} from '@/api/timesheets'
import { getLeaveBalance, getLocks } from '@/api/admin'
import { getApiError } from '@/api/client'

const MOCK_USER = {
  name:        'Raj Kumar',
  employeeId:  '001',
  managerName: 'Ramkumar Pichai',
}

const ROWS_PER_PAGE = 6

const DAY_LABELS: Record<string, string> = {
  Working: 'Working',
  Leave:   'Leave',
  Holiday: 'Holiday',
  HalfDay: 'Half-day',
  CompOff: 'Comp-off',
}

interface Submission {
  id: number
  client_name: string
  client_manager_name: string
  client_manager_email: string
  from_date: string
  to_date: string
  submitted_at: string
  cs_status: string
  rejection_note?: string | null
}

interface MonthLock { year: number; month: number }

function ClientResponseBadge({ status, note }: { status: string; note?: string | null }) {
  const cfg =
    status === 'Approved' ? { icon: <CheckCircle2 size={12} />, color: '#34D399', label: 'Approved' } :
    status === 'Rejected' ? { icon: <XCircle size={12} />,       color: '#F87171', label: 'Rejected' } :
                            { icon: <Clock size={12} />,          color: '#FBB024', label: 'Pending' }
  return (
    <Tooltip title={status === 'Rejected' && note ? `Reason: ${note}` : ''} placement="top">
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 8px', borderRadius: 20,
        background: `${cfg.color}18`, border: `1px solid ${cfg.color}55`,
        color: cfg.color, fontSize: 12, fontFamily: 'var(--fontFamily-two)',
      }}>
        {cfg.icon}{cfg.label}
      </span>
    </Tooltip>
  )
}

export default function TracksheetPage() {
  const [entries, setEntries]               = useState<TimesheetEntry[]>([])
  const [loading, setLoading]               = useState(true)
  const [leaveBalance, setLeaveBalance]     = useState<number | null>(null)
  const [drawerOpen, setDrawerOpen]         = useState(false)
  const [submitOpen, setSubmitOpen]         = useState(false)
  const [editEntry, setEditEntry]           = useState<TimesheetEntry | null>(null)
  const [viewEntry, setViewEntry]           = useState<TimesheetEntry | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [page, setPage]                     = useState(1)
  const [selectedMonth, setSelectedMonth]   = useState<Dayjs>(dayjs().startOf('month'))
  const [mainTab, setMainTab]               = useState<'entries' | 'history'>('entries')
  const [viewMode, setViewMode]             = useState<'table' | 'calendar'>('table')
  const [submissions, setSubmissions]       = useState<Submission[]>([])
  const [subLoading, setSubLoading]         = useState(false)
  const [lockedMonths, setLockedMonths]     = useState<MonthLock[]>([])
  const { addToast }                        = useToast()

  const fetchEntries = useCallback(async (month: Dayjs) => {
    setLoading(true)
    try {
      const from = month.startOf('month').format('YYYY-MM-DD')
      const to   = month.endOf('month').format('YYYY-MM-DD')
      const data = await getTimesheets({ from, to })
      setEntries(data)
    } catch {
      addToast('Failed to load entries. Please refresh.', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  const fetchSubmissions = useCallback(async () => {
    setSubLoading(true)
    try {
      const data = await getSubmissions()
      setSubmissions(data)
    } catch {
      addToast('Failed to load submission history.', 'error')
    } finally {
      setSubLoading(false)
    }
  }, [addToast])

  const fetchLocks = useCallback(async () => {
    try {
      const data = await getLocks()
      setLockedMonths(data.map((l) => ({ year: l.year, month: l.month })))
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchEntries(selectedMonth)
    fetchLocks()
    getLeaveBalance().then((d) => setLeaveBalance(d.balance ?? 0)).catch(() => setLeaveBalance(0))
  }, [fetchLocks]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchEntries(selectedMonth)
    setPage(1)
  }, [selectedMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mainTab === 'history') fetchSubmissions()
  }, [mainTab, fetchSubmissions])

  const handleDownloadCSV = () => {
    if (entries.length === 0) return
    const csv  = generateTimesheetCSV(entries, MOCK_USER)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    const from = entries.reduce((min, e) => e.work_date < min ? e.work_date : min, entries[0].work_date)
    const to   = entries.reduce((max, e) => e.work_date > max ? e.work_date : max, entries[0].work_date)
    a.href     = url
    a.download = getTimesheetFilename(MOCK_USER.employeeId, from, to)
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadExcel = () => {
    if (entries.length === 0) return
    const rows = entries.map(e => ({
      'Date':              dayjs(e.work_date).format('DD/MM/YYYY'),
      'Day':               dayjs(e.work_date).format('dddd'),
      'Employee ID':       MOCK_USER.employeeId,
      'Employee Name':     MOCK_USER.name,
      'Reporting Manager': MOCK_USER.managerName,
      'Client':            e.client_name ?? '',
      'Project':           e.project_name ?? '',
      'Day Type':          e.type_of_day,
      'Hours':             e.hours_worked ?? '',
      'Comments':          e.comments ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Timesheet')
    XLSX.writeFile(wb, `${MOCK_USER.employeeId}_Timesheet.xlsx`)
  }

  const handleSaved = (entry: TimesheetEntry) => {
    setEntries(prev => {
      const exists = prev.find(e => e.timesheet_id === entry.timesheet_id)
      if (exists) return prev.map(e => e.timesheet_id === entry.timesheet_id ? entry : e)
      return [entry, ...prev]
    })
  }

  const handleDeleteConfirm = async (id: number) => {
    try {
      await deleteTimesheet(id)
      setEntries(prev => prev.filter(e => e.timesheet_id !== id))
      addToast('Entry deleted.', 'info')
    } catch (err: unknown) {
      addToast(getApiError(err, 'Delete failed'), 'error')
    } finally {
      setDeleteConfirmId(null)
    }
  }

  const openAdd = () => { setEditEntry(null); setDrawerOpen(true) }
  const openEdit = (entry: TimesheetEntry) => { setEditEntry(entry); setDrawerOpen(true) }

  const handleCalendarDayClick = (date: string, existing?: TimesheetEntry) => {
    if (existing) {
      if (!isLocked(existing)) { openEdit(existing) }
      else { setViewEntry(existing) }
    } else {
      setEditEntry(null)
      setDrawerOpen(true)
    }
  }

  const isLocked  = (e: TimesheetEntry) => dayjs().diff(dayjs(e.created_at ?? e.work_date), 'day') > 14
  const canEdit   = (e: TimesheetEntry) => !isLocked(e)
  const canDelete = (e: TimesheetEntry) => !isLocked(e)

  const pageCount = Math.max(1, Math.ceil(entries.length / ROWS_PER_PAGE))
  const pageRows  = entries.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE)

  const summary = {
    working:  entries.filter(e => e.type_of_day === 'Working' || e.type_of_day === 'HalfDay').length,
    holidays: entries.filter(e => e.type_of_day === 'Holiday').length,
    leaves:   entries.filter(e => e.type_of_day === 'Leave' || e.type_of_day === 'CompOff').length,
  }

  return (
    <div className="ts-page">

      <div className="ts-topbar glass-card">
        <div className="ts-topbar-left">
          <h1 className="ts-page-title">TimeSheet</h1>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              views={['year', 'month']}
              value={selectedMonth}
              onChange={(v) => v && setSelectedMonth(v.startOf('month'))}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: {
                    '& .MuiInputBase-root': { color: 'rgba(255,255,255,0.85)', borderRadius: '10px', height: 34, fontSize: 13, fontFamily: 'var(--fontFamily-two)' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.12)' },
                    '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.4)', fontSize: 18 },
                    width: 152,
                  },
                },
              }}
            />
          </LocalizationProvider>
          <Tooltip title="1.5 days leave credited on the 1st of every month." placement="bottom">
            <div className="ts-leave-bal glass-card-sm" style={{ cursor: 'default' }}>
              <BarChart2 size={13} color="#34D399" />
              <span>Leave Balance: <strong>{leaveBalance ?? '…'}</strong></span>
              <Info size={11} style={{ color: 'rgba(255,255,255,0.35)', marginLeft: 2 }} />
            </div>
          </Tooltip>
        </div>

        <div className="ts-topbar-right">
          <div className="ts-tab-pills">
            <button
              className={`ts-pill${mainTab === 'entries' ? ' ts-pill--active' : ''}`}
              onClick={() => setMainTab('entries')}
            >
              Entries
            </button>
            <button
              className={`ts-pill${mainTab === 'history' ? ' ts-pill--active' : ''}`}
              onClick={() => setMainTab('history')}
            >
              Submission History
            </button>
          </div>

          {mainTab === 'entries' && (
            <>
              <div className="ts-view-toggle">
                <Tooltip title="Table view">
                  <button
                    className={`ts-icon-btn${viewMode === 'table' ? ' ts-icon-btn--active-mode' : ''}`}
                    onClick={() => setViewMode('table')}
                  >
                    <List size={15} />
                  </button>
                </Tooltip>
                <Tooltip title="Calendar view">
                  <button
                    className={`ts-icon-btn${viewMode === 'calendar' ? ' ts-icon-btn--active-mode' : ''}`}
                    onClick={() => setViewMode('calendar')}
                  >
                    <CalendarDays size={15} />
                  </button>
                </Tooltip>
              </div>

              {entries.length > 0 && (
                <>
                  <Tooltip title="Download CSV">
                    <button className="ts-btn ts-btn--secondary" onClick={handleDownloadCSV}>
                      <Download size={15} /> CSV
                    </button>
                  </Tooltip>
                  <Tooltip title="Download Excel">
                    <button className="ts-btn ts-btn--secondary" onClick={handleDownloadExcel}>
                      <FileSpreadsheet size={15} /> Excel
                    </button>
                  </Tooltip>
                </>
              )}

              <Tooltip title="Submit timesheet to your client manager">
                <button className="ts-btn ts-btn--secondary" onClick={() => setSubmitOpen(true)}>
                  <Send size={15} /> Submit to Client
                </button>
              </Tooltip>

              <button className="ts-btn ts-btn--primary" onClick={openAdd}>
                <Plus size={15} /> Add Entry
              </button>
            </>
          )}
        </div>
      </div>

      {mainTab === 'entries' && (
        <>
          <div className="ts-summary-row">
            {[
              { label: 'Working Days',  value: summary.working,  color: '#60A5FA' },
              { label: 'Holidays',      value: summary.holidays, color: '#FBB024' },
              { label: 'Leaves Taken',  value: summary.leaves,   color: '#F472B6' },
            ].map(({ label, value, color }) => (
              <div key={label} className="ts-summary-tile glass-card-sm">
                <span className="ts-summary-val" style={{ color }}>{value}</span>
                <span className="ts-summary-lbl">{label}</span>
              </div>
            ))}
          </div>

          {viewMode === 'calendar' ? (
            <TimesheetCalendar
              entries={entries}
              lockedMonths={lockedMonths}
              onDayClick={handleCalendarDayClick}
            />
          ) : (
            <>
              <div className="ts-table-wrap glass-card">
                <TableContainer sx={{ height: '100%', background: 'transparent' }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        {['Date', 'Client / Project', 'Type', 'Hours', 'Actions'].map(col => (
                          <TableCell key={col} className="ts-th">{col}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, background: 'transparent', border: 'none' }}>
                            <span className="ts-empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                              Loading entries…
                            </span>
                          </TableCell>
                        </TableRow>
                      ) : pageRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, background: 'transparent', border: 'none' }}>
                            <span className="ts-empty">No entries found.</span>
                          </TableCell>
                        </TableRow>
                      ) : pageRows.map(entry => (
                        <TableRow key={entry.timesheet_id} className="ts-row">
                          <TableCell className="ts-td ts-td--date">
                            {dayjs(entry.work_date).format('DD MMM YYYY')}
                          </TableCell>
                          <TableCell className="ts-td ts-td--task">
                            <Tooltip title={entry.comments ?? ''} placement="top-start" disableHoverListener={!entry.comments}>
                              <span className="ts-task-text">
                                {[entry.client_name, entry.project_name].filter(Boolean).join(' · ') || '—'}
                              </span>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="ts-td">{DAY_LABELS[entry.type_of_day] ?? entry.type_of_day}</TableCell>
                          <TableCell className="ts-td ts-td--hours">
                            {entry.hours_worked != null ? `${entry.hours_worked}h` : '—'}
                          </TableCell>
                          <TableCell className="ts-td ts-td--actions">
                            {isLocked(entry) ? (
                              <Tooltip title="Locked after 2 weeks">
                                <button className="ts-icon-btn ts-icon-btn--view" onClick={() => setViewEntry(entry)}>
                                  <Lock size={14} />
                                </button>
                              </Tooltip>
                            ) : (
                              <Tooltip title="View Details">
                                <button className="ts-icon-btn ts-icon-btn--view" onClick={() => setViewEntry(entry)}>
                                  <Eye size={14} />
                                </button>
                              </Tooltip>
                            )}
                            <Tooltip title={canEdit(entry) ? 'Edit' : 'Locked after 2 weeks'}>
                              <span>
                                <button className="ts-icon-btn ts-icon-btn--edit" onClick={() => openEdit(entry)} disabled={!canEdit(entry)}>
                                  <Pencil size={14} />
                                </button>
                              </span>
                            </Tooltip>
                            {deleteConfirmId === entry.timesheet_id ? (
                              <span className="ts-delete-confirm">
                                <Tooltip title="Confirm delete">
                                  <button className="ts-icon-btn ts-icon-btn--delete" onClick={() => handleDeleteConfirm(entry.timesheet_id)}>
                                    <AlertCircle size={14} />
                                  </button>
                                </Tooltip>
                                <Tooltip title="Cancel">
                                  <button className="ts-icon-btn ts-icon-btn--cancel-del" onClick={() => setDeleteConfirmId(null)}>✕</button>
                                </Tooltip>
                              </span>
                            ) : (
                              <Tooltip title={canDelete(entry) ? 'Delete' : 'Locked after 2 weeks'}>
                                <span>
                                  <button className="ts-icon-btn ts-icon-btn--delete" onClick={() => setDeleteConfirmId(entry.timesheet_id)} disabled={!canDelete(entry)}>
                                    <Trash2 size={14} />
                                  </button>
                                </span>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </div>

              <div className="ts-pagination glass-card-sm">
                <span className="ts-pagination-info">{entries.length} entr{entries.length === 1 ? 'y' : 'ies'}</span>
                <Pagination
                  count={pageCount} page={page}
                  onChange={(_, v) => setPage(v)}
                  size="small"
                  sx={{
                    '.MuiPaginationItem-root': { color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--fontFamily-two)', fontSize: 12 },
                    '.Mui-selected': { backgroundColor: 'var(--accent-purple) !important', color: 'white !important' },
                  }}
                />
              </div>
            </>
          )}
        </>
      )}

      {mainTab === 'history' && (
        <div className="ts-table-wrap glass-card">
          <TableContainer sx={{ height: '100%', background: 'transparent' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {['Date Submitted', 'Client', 'Manager', 'Period', 'Client Response'].map(col => (
                    <TableCell key={col} className="ts-th">{col}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {subLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6, background: 'transparent', border: 'none' }}>
                      <span className="ts-empty" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Loading history…
                      </span>
                    </TableCell>
                  </TableRow>
                ) : submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 6, background: 'transparent', border: 'none' }}>
                      <span className="ts-empty">No submissions yet.</span>
                    </TableCell>
                  </TableRow>
                ) : submissions.map(sub => (
                  <TableRow key={sub.id} className="ts-row">
                    <TableCell className="ts-td">{dayjs(sub.submitted_at).format('DD MMM YYYY')}</TableCell>
                    <TableCell className="ts-td">{sub.client_name}</TableCell>
                    <TableCell className="ts-td">
                      <div>{sub.client_manager_name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{sub.client_manager_email}</div>
                    </TableCell>
                    <TableCell className="ts-td" style={{ whiteSpace: 'nowrap' }}>
                      {dayjs(sub.from_date).format('DD MMM')} → {dayjs(sub.to_date).format('DD MMM YYYY')}
                    </TableCell>
                    <TableCell className="ts-td">
                      <ClientResponseBadge status={sub.cs_status} note={sub.rejection_note} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}

      <TimesheetDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onSaved={handleSaved} editEntry={editEntry} />
      <ViewEntryModal open={viewEntry !== null} entry={viewEntry} onClose={() => setViewEntry(null)} />
      <SubmitToClientDrawer open={submitOpen} onClose={() => setSubmitOpen(false)} entries={entries} user={MOCK_USER} />
    </div>
  )
}
