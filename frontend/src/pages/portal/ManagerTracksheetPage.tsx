import React, { useState, useEffect, useCallback } from 'react'
import './manager.scss'
import dayjs from 'dayjs'
import { CheckCircle, XCircle, Clock, User, Calendar, Loader2 } from 'lucide-react'
import DenyReasonModal from '@/components/timesheet/DenyReasonModal'
import StatusBadge from '@/components/timesheet/StatusBadge'
import { useToast } from '@/context/ToastContext'
import type { TimesheetEntry, ManagerGroupedResponse } from '@/types/timesheet'
import { getManagerTimesheets, approveTimesheet } from '@/api/timesheets'
import { getApiError } from '@/api/client'

const DAY_LABELS: Record<string, string> = {
  Working: 'Working',
  Leave:   'Leave',
  Holiday: 'Holiday',
  HalfDay: 'Half-day',
  CompOff: 'Comp-off',
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

const AVATAR_COLORS = ['#3B82F6', '#0EA5E9', '#EC4899', '#10B981', '#F59E0B', '#60A5FA']
function avatarColor(userId: string) {
  let hash = 0
  for (const ch of userId) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function ManagerTracksheetPage() {
  const [groups, setGroups]           = useState<ManagerGroupedResponse[]>([])
  const [loading, setLoading]         = useState(true)
  const [denyingEntry, setDenyingEntry] = useState<TimesheetEntry | null>(null)
  const [denyingName, setDenyingName] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('All')
  const { addToast } = useToast()

  const fetchGroups = useCallback(async () => {
    try {
      const data = await getManagerTimesheets()
      setGroups(data)
    } catch {
      addToast('Failed to load submissions. Please refresh.', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => { fetchGroups() }, [fetchGroups])

  const handleApprove = async (id: number) => {
    try {
      const updated = await approveTimesheet(id, 'Approved')
      patchEntry(updated)
      addToast('Entry approved.', 'success')
    } catch (err) {
      addToast(getApiError(err, 'Failed to approve entry.'), 'error')
    }
  }

  const handleDenyConfirm = async (reason: string) => {
    if (!denyingEntry) return
    try {
      const updated = await approveTimesheet(denyingEntry.timesheet_id, 'Denied', reason)
      patchEntry(updated)
      addToast('Entry denied.', 'info')
    } catch (err) {
      addToast(getApiError(err, 'Failed to deny entry.'), 'error')
    } finally {
      setDenyingEntry(null)
      setDenyingName('')
    }
  }

  const patchEntry = (updated: TimesheetEntry) => {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        entries: g.entries.map((e) =>
          e.timesheet_id === updated.timesheet_id ? updated : e
        ),
      }))
    )
  }

  const startDeny = (entry: TimesheetEntry, name: string) => {
    setDenyingEntry(entry)
    setDenyingName(name)
  }

  const allEntries = groups.flatMap((g) => g.entries)
  const counts = {
    pending:  allEntries.filter((e) => e.status === 'Pending').length,
    approved: allEntries.filter((e) => e.status === 'Approved').length,
    denied:   allEntries.filter((e) => e.status === 'Denied').length,
  }

  const filtered = filterStatus === 'All'
    ? groups
    : groups
        .map((g) => ({ ...g, entries: g.entries.filter((e) => e.status === filterStatus) }))
        .filter((g) => g.entries.length > 0)

  return (
    <div className="mgr-page">
      <div className="mgr-header glass-card">
        <div className="mgr-header-left">
          <h1 className="mgr-title">Approvals</h1>
          <p className="mgr-subtitle">Review and action your team&apos;s timesheet entries</p>
        </div>

        <div className="mgr-summary-chips">
          <div className="mgr-chip mgr-chip--pending">
            <Clock size={13} />
            <span>{counts.pending} Pending</span>
          </div>
          <div className="mgr-chip mgr-chip--approved">
            <CheckCircle size={13} />
            <span>{counts.approved} Approved</span>
          </div>
          <div className="mgr-chip mgr-chip--denied">
            <XCircle size={13} />
            <span>{counts.denied} Denied</span>
          </div>
        </div>
      </div>

      <div className="mgr-filters">
        {['All', 'Pending', 'Approved', 'Denied'].map((s) => (
          <button
            key={s}
            className={`ts-pill${filterStatus === s ? ' ts-pill--active' : ''}`}
            onClick={() => setFilterStatus(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {loading && (
        <div className="mgr-empty glass-card">
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Loading entries…</span>
        </div>
      )}

      {!loading && (
        <div className="mgr-grid">
          {filtered.length === 0 && (
            <div className="mgr-empty glass-card">
              <span>No entries found.</span>
            </div>
          )}

          {filtered.map((group) => {
            const color = avatarColor(group.user_id)
            const initials = getInitials(group.full_name)

            return (
              <div key={group.user_id} className="mgr-card glass-card">
                <div className="mgr-card-header">
                  <div
                    className="mgr-avatar"
                    style={{ background: `${color}22`, borderColor: `${color}44`, color }}
                  >
                    {initials}
                  </div>
                  <div className="mgr-card-identity">
                    <span className="mgr-emp-name">{group.full_name}</span>
                    <span className="mgr-emp-role">{group.email}</span>
                  </div>
                  <div className="mgr-card-status">
                    <span className="mgr-entry-count">{group.entries.length} entr{group.entries.length === 1 ? 'y' : 'ies'}</span>
                  </div>
                </div>

                <div className="mgr-entry-list">
                  {group.entries.map((entry) => (
                    <div key={entry.timesheet_id} className="mgr-entry-row">
                      <div className="mgr-entry-left">
                        <div className="mgr-meta-item">
                          <Calendar size={12} />
                          <span>{dayjs(entry.work_date).format('DD MMM YYYY')}</span>
                        </div>
                        <div className="mgr-meta-item">
                          <User size={12} />
                          <span>
                            {[entry.client_name, entry.project_name].filter(Boolean).join(' · ') || '—'}
                            {' · '}
                            {DAY_LABELS[entry.type_of_day] ?? entry.type_of_day}
                            {entry.hours_worked != null ? ` · ${entry.hours_worked}h` : ''}
                          </span>
                        </div>
                        {entry.status === 'Denied' && entry.manager_reason && (
                          <div className="mgr-deny-reason">
                            <span className="mgr-deny-label">Reason:</span>
                            <span className="mgr-deny-text">{entry.manager_reason}</span>
                          </div>
                        )}
                      </div>

                      <div className="mgr-entry-right">
                        <StatusBadge status={entry.status} />
                        {entry.status === 'Pending' && (
                          <div className="mgr-actions">
                            <button
                              className="mgr-action-btn mgr-action-btn--deny"
                              onClick={() => startDeny(entry, group.full_name)}
                            >
                              <XCircle size={13} />
                              Deny
                            </button>
                            <button
                              className="mgr-action-btn mgr-action-btn--approve"
                              onClick={() => handleApprove(entry.timesheet_id)}
                            >
                              <CheckCircle size={13} />
                              Approve
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <DenyReasonModal
        open={denyingEntry !== null}
        employeeName={denyingName}
        period={denyingEntry ? dayjs(denyingEntry.work_date).format('DD MMM YYYY') : ''}
        onClose={() => { setDenyingEntry(null); setDenyingName('') }}
        onConfirm={handleDenyConfirm}
      />
    </div>
  )
}
