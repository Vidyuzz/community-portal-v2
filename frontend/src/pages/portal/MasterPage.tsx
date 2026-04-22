import React, { useState, useEffect, useCallback } from 'react'
import './handlers.scss'
import { useNavigate } from 'react-router-dom'
import {
  getStats,
  getLocks,
  createLock,
  deleteLock,
  getUsers,
  updateUser,
  bulkCredit,
  sendReminders,
} from '@/api/admin'
import { getApiError } from '@/api/client'
import {
  LayoutDashboard, Lock, Calendar, Users, Bell,
  Unlock, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp,
  Send, Copy, Check,
} from 'lucide-react'
import dayjs from 'dayjs'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminStats {
  totalEmployees:       number
  submissionsThisMonth: number
  lockedMonths:         number
  pendingTimesheets:    number
}

interface MonthLock {
  id:        number
  year:      number
  month:     number
  locked_by: string
  locked_at: string | null
}

interface AdminUser {
  id:             string
  name:           string
  email:          string
  role:           string
  employeeId:     string | null
  designation:    string | null
  specialization: string | null
  department:     string | null
  managerId:      string | null
  leave_balance:  number
  manager:        { name: string } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const ROLE_COLOR: Record<string, string> = {
  ADMIN:    '#F59E0B',
  EMPLOYEE: '#6EE7B7',
}

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div className={`adm-toast ${ok ? 'adm-toast--ok' : 'adm-toast--err'}`}>
      {ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
      {msg}
    </div>
  )
}

// ─── Tab 1: Dashboard ─────────────────────────────────────────────────────────

function DashboardTab() {
  const [stats, setStats]       = useState<AdminStats | null>(null)
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null)
  const [locking, setLocking]   = useState(false)

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    getStats().then(setStats).catch(() => {})
  }, [])

  const lockCurrentMonth = async () => {
    setLocking(true)
    const now = dayjs()
    try {
      await createLock(now.year(), now.month() + 1)
      showToast(`${now.format('MMMM YYYY')} locked successfully.`, true)
      setStats(await getStats())
    } catch (e) {
      showToast(getApiError(e, 'Already locked or failed.'), false)
    } finally {
      setLocking(false)
    }
  }

  const sendReminder = async (type: 'weekly' | 'monthly') => {
    try {
      const d = await sendReminders(type)
      showToast(`Sent to ${d.sent} employees (${d.skipped} skipped).`, true)
    } catch {
      showToast('Failed to send reminders.', false)
    }
  }

  const statCards = stats ? [
    { label: 'Total Employees',        value: stats.totalEmployees,       color: '#6366F1' },
    { label: 'Submissions This Month', value: stats.submissionsThisMonth, color: '#10B981' },
    { label: 'Locked Months',          value: stats.lockedMonths,         color: '#F59E0B' },
  ] : []

  return (
    <div className="adm-tab-body">
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      <div className="adm-stat-grid">
        {stats === null
          ? [1,2,3,4].map(i => <div key={i} className="adm-stat-card adm-stat-card--loading" />)
          : statCards.map(s => (
            <div key={s.label} className="adm-stat-card glass-card">
              <div className="adm-stat-val" style={{ color: s.color }}>{s.value}</div>
              <div className="adm-stat-label">{s.label}</div>
            </div>
          ))}
      </div>

      <div className="adm-quick-actions">
        <h3 className="adm-section-title">Quick Actions</h3>
        <div className="adm-action-row">
          <button className="adm-action-btn adm-action-btn--amber" onClick={lockCurrentMonth} disabled={locking}>
            <Lock size={14} /> {locking ? 'Locking…' : `Lock ${dayjs().format('MMMM YYYY')}`}
          </button>
          <button className="adm-action-btn adm-action-btn--blue" onClick={() => sendReminder('weekly')}>
            <Bell size={14} /> Send Weekly Reminder
          </button>
          <button className="adm-action-btn adm-action-btn--purple" onClick={() => sendReminder('monthly')}>
            <Bell size={14} /> Send Month-End Reminder
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tab 2: Timesheet Lock ────────────────────────────────────────────────────

function LockTab() {
  const [locks, setLocks]   = useState<MonthLock[]>([])
  const [year,  setYear]    = useState(dayjs().year())
  const [month, setMonth]   = useState(dayjs().month() + 1)
  const [toast, setToast]   = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchLocks = useCallback(() => {
    getLocks().then(setLocks).catch(() => {})
  }, [])

  useEffect(() => { fetchLocks() }, [fetchLocks])

  const addLock = async () => {
    try {
      await createLock(year, month)
      showToast(`${MONTH_NAMES[month-1]} ${year} locked.`, true)
      fetchLocks()
    } catch (e) {
      showToast(getApiError(e, 'Failed.'), false)
    }
  }

  const removeLock = async (id: number) => {
    try {
      await deleteLock(id)
      showToast('Lock removed.', true)
      fetchLocks()
    } catch (e) {
      showToast(getApiError(e, 'Failed to remove lock.'), false)
    }
  }

  return (
    <div className="adm-tab-body">
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      <div className="adm-lock-warning glass-card">
        <Lock size={14} style={{ color: '#F59E0B', flexShrink: 0 }} />
        <span>Locking a month prevents all employees from editing or adding timesheet entries for that period.</span>
      </div>

      <div className="adm-lock-form glass-card">
        <h3 className="adm-section-title" style={{ marginBottom: 14 }}>Lock a Month</h3>
        <div className="adm-lock-form-row">
          <div className="adm-field-wrap">
            <label className="adm-field-label">Year</label>
            <select className="adm-select" value={year} onChange={e => setYear(+e.target.value)}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="adm-field-wrap">
            <label className="adm-field-label">Month</label>
            <select className="adm-select" value={month} onChange={e => setMonth(+e.target.value)}>
              {MONTH_NAMES.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
            </select>
          </div>
          <button className="adm-action-btn adm-action-btn--amber" onClick={addLock}>
            <Lock size={13} /> Lock Month
          </button>
        </div>
      </div>

      <div className="adm-table-wrap glass-card">
        <h3 className="adm-section-title">Locked Months</h3>
        {locks.length === 0 ? (
          <div className="adm-empty">No months are currently locked.</div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Month</th><th>Year</th><th>Locked At</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {locks.map(l => (
                <tr key={l.id}>
                  <td>{MONTH_NAMES[l.month - 1]}</td>
                  <td>{l.year}</td>
                  <td>{dayjs(l.locked_at).format('DD MMM YYYY, HH:mm')}</td>
                  <td>
                    <button className="adm-icon-btn adm-icon-btn--red" onClick={() => removeLock(l.id)}>
                      <Unlock size={14} /> Unlock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── Tab 3: Leave Balances ────────────────────────────────────────────────────

function LeaveTab() {
  const [users,    setUsers]    = useState<AdminUser[]>([])
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null)
  const [confirm,  setConfirm]  = useState(false)
  const [bulkAmt,  setBulkAmt]  = useState(1.5)

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchUsers = useCallback(() => {
    getUsers().then(setUsers).catch(() => {})
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const adjustBalance = async (id: string, delta: number) => {
    const u = users.find(x => x.id === id)
    if (!u) return
    try {
      await updateUser(id, { leave_balance: Math.max(0, u.leave_balance + delta) })
      setUsers(prev => prev.map(x => x.id === id ? { ...x, leave_balance: Math.max(0, x.leave_balance + delta) } : x))
    } catch {
      showToast('Update failed.', false)
    }
  }

  const applyBulkCredit = async () => {
    try {
      await bulkCredit(bulkAmt)
      showToast(`Added ${bulkAmt} days to all employees.`, true)
      fetchUsers()
    } catch {
      showToast('Bulk credit failed.', false)
    }
    setConfirm(false)
  }

  return (
    <div className="adm-tab-body">
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      <div className="adm-bulk-row glass-card">
        <div style={{ flex: 1 }}>
          <div className="adm-section-title">Bulk Leave Credit</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>
            Add days to all employees at once
          </div>
        </div>
        <div className="adm-lock-form-row" style={{ gap: 8 }}>
          <div className="adm-field-wrap">
            <label className="adm-field-label">Days</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              className="adm-input"
              style={{ width: 80 }}
              value={bulkAmt}
              onChange={e => setBulkAmt(+e.target.value)}
            />
          </div>
          {!confirm ? (
            <button className="adm-action-btn adm-action-btn--green" onClick={() => setConfirm(true)}>
              Add {bulkAmt}d to ALL
            </button>
          ) : (
            <>
              <span style={{ color: '#F87171', fontSize: 12 }}>Confirm?</span>
              <button className="adm-action-btn adm-action-btn--red" onClick={applyBulkCredit}>Yes, Apply</button>
              <button className="adm-action-btn" onClick={() => setConfirm(false)}>Cancel</button>
            </>
          )}
        </div>
      </div>

      <div className="adm-table-wrap glass-card">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Employee</th><th>ID</th><th>Balance (days)</th><th>Adjust</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{u.email}</div>
                </td>
                <td>{u.employeeId ?? '—'}</td>
                <td>
                  <span style={{ color: u.leave_balance > 0 ? '#6EE7B7' : '#F87171', fontWeight: 600 }}>
                    {u.leave_balance}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="adm-adj-btn adm-adj-btn--green" onClick={() => adjustBalance(u.id, 0.5)}>+0.5</button>
                    <button className="adm-adj-btn adm-adj-btn--green" onClick={() => adjustBalance(u.id, 1)}>+1</button>
                    <button className="adm-adj-btn adm-adj-btn--red"   onClick={() => adjustBalance(u.id, -1)}>−1</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Tab 4: Users ─────────────────────────────────────────────────────────────

function UsersTab() {
  const [users,    setUsers]    = useState<AdminUser[]>([])
  const [editing,  setEditing]  = useState<AdminUser | null>(null)
  const [form,     setForm]     = useState<Partial<AdminUser>>({})
  const [toast,    setToast]    = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  useEffect(() => {
    getUsers().then(setUsers).catch(() => {})
  }, [])

  const openEdit = (u: AdminUser) => {
    setEditing(u)
    setForm({
      designation:    u.designation    ?? '',
      specialization: u.specialization ?? '',
      department:     u.department     ?? '',
      employeeId:     u.employeeId     ?? '',
      managerId:      u.managerId      ?? '',
      role:           u.role,
    })
  }

  const saveEdit = async () => {
    if (!editing) return
    try {
      const updated = await updateUser(editing.id, {
        designation:    form.designation    ?? undefined,
        specialization: form.specialization ?? undefined,
        department:     form.department     ?? undefined,
        employeeId:     form.employeeId     ?? undefined,
        managerId:      form.managerId || null,
        role:           form.role as AdminUser['role'],
      })
      setUsers(prev => prev.map(u => (u.id === updated.id ? { ...u, ...updated, manager: u.manager } : u)))
      showToast('User updated.', true)
      setEditing(null)
    } catch {
      showToast('Update failed.', false)
    }
  }

  return (
    <div className="adm-tab-body">
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      <div className="adm-table-wrap glass-card">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Name</th><th>Role</th><th>Department</th><th>Manager</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{u.email}</div>
                </td>
                <td>
                  <span className="adm-role-badge"
                    style={{ background: `${ROLE_COLOR[u.role]}22`, color: ROLE_COLOR[u.role], border: `1px solid ${ROLE_COLOR[u.role]}44` }}>
                    {u.role}
                  </span>
                </td>
                <td>{u.department ?? '—'}</td>
                <td>{u.manager?.name ?? '—'}</td>
                <td>
                  <button className="adm-icon-btn adm-icon-btn--blue" onClick={() => openEdit(u)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="adm-modal-overlay" onClick={() => setEditing(null)}>
          <div className="adm-modal glass-card" onClick={e => e.stopPropagation()}>
            <h3 className="adm-section-title" style={{ marginBottom: 18 }}>Edit {editing.name}</h3>

            {[
              { key: 'employeeId',     label: 'Employee ID' },
              { key: 'designation',    label: 'Designation' },
              { key: 'specialization', label: 'Specialization (e.g. React · TypeScript)' },
              { key: 'department',     label: 'Department' },
            ].map(f => (
              <div key={f.key} className="adm-field-wrap" style={{ marginBottom: 14, width: '100%' }}>
                <label className="adm-field-label">{f.label}</label>
                <input
                  className="adm-input"
                  style={{ width: '100%' }}
                  value={(form as Record<string, string>)[f.key] ?? ''}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                />
              </div>
            ))}

            <div className="adm-field-wrap" style={{ marginBottom: 14, width: '100%' }}>
              <label className="adm-field-label">Role</label>
              <select className="adm-select" style={{ width: '100%' }} value={form.role ?? ''} onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}>
                <option value="EMPLOYEE">EMPLOYEE</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button className="adm-action-btn adm-action-btn--blue" style={{ flex: 1 }} onClick={saveEdit}>Save</button>
              <button className="adm-action-btn" style={{ flex: 1 }} onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab 5: Reminders ────────────────────────────────────────────────────────

const SCHTASK_WEEKLY = `schtasks /create /tn "GSR Weekly Reminder" /tr "curl -X POST http://localhost:8000/api/reminders/send -H \\"Content-Type: application/json\\" -d {\\"type\\":\\"weekly\\"}" /sc weekly /d FRI /st 17:00`
const SCHTASK_MONTHLY = `schtasks /create /tn "GSR Monthly Reminder" /tr "curl -X POST http://localhost:8000/api/reminders/send -H \\"Content-Type: application/json\\" -d {\\"type\\":\\"monthly\\"}" /sc monthly /d 28 /st 10:00`

function RemindersTab() {
  const [toast,      setToast]      = useState<{ msg: string; ok: boolean } | null>(null)
  const [copying,    setCopying]    = useState<string | null>(null)
  const [showSched,  setShowSched]  = useState(false)

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const sendReminder = async (type: 'weekly' | 'monthly') => {
    try {
      const d = await sendReminders(type)
      showToast(`Sent to ${d.sent} employees (${d.skipped} skipped).`, true)
    } catch {
      showToast('Failed to send reminders.', false)
    }
  }

  const copyCmd = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopying(id)
      setTimeout(() => setCopying(null), 1800)
    })
  }

  return (
    <div className="adm-tab-body">
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      <div className="adm-reminder-cards">
        {[
          {
            title:   'Weekly Reminder',
            desc:    "Sent to employees who haven't submitted any timesheet entries this week.",
            type:    'weekly' as const,
            color:   '#60A5FA',
          },
          {
            title:   'Month-End Reminder',
            desc:    "Remind all employees to submit their timesheet to the client before the 1st.",
            type:    'monthly' as const,
            color:   '#A78BFA',
          },
        ].map(r => (
          <div key={r.type} className="adm-reminder-card glass-card">
            <Bell size={20} style={{ color: r.color }} />
            <div style={{ flex: 1 }}>
              <div className="adm-reminder-title">{r.title}</div>
              <div className="adm-reminder-desc">{r.desc}</div>
            </div>
            <button
              className="adm-action-btn"
              style={{ background: `${r.color}22`, border: `1px solid ${r.color}44`, color: r.color }}
              onClick={() => sendReminder(r.type)}
            >
              <Send size={13} /> Send Now
            </button>
          </div>
        ))}
      </div>

      {/* Auto-scheduling section */}
      <div className="adm-sched-section glass-card">
        <button className="adm-sched-toggle" onClick={() => setShowSched(s => !s)}>
          <span>Setup Automatic Scheduling (Windows Task Scheduler)</span>
          {showSched ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showSched && (
          <div className="adm-sched-body">
            <p className="adm-sched-note">
              Run these commands in an Administrator PowerShell / Command Prompt to schedule automatic reminders:
            </p>
            {[
              { id: 'weekly',  label: 'Weekly (every Friday at 5pm)',    cmd: SCHTASK_WEEKLY  },
              { id: 'monthly', label: 'Month-End (28th of each month)',   cmd: SCHTASK_MONTHLY },
            ].map(c => (
              <div key={c.id} className="adm-cmd-block">
                <div className="adm-cmd-label">{c.label}</div>
                <div className="adm-cmd-row">
                  <code className="adm-cmd-code">{c.cmd}</code>
                  <button className="adm-copy-btn" onClick={() => copyCmd(c.id, c.cmd)}>
                    {copying === c.id ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'dashboard', label: 'Dashboard',      icon: LayoutDashboard },
  { key: 'locks',     label: 'Timesheet Lock', icon: Lock            },
  { key: 'leave',     label: 'Leave Balances', icon: Calendar        },
  { key: 'users',     label: 'Users',          icon: Users           },
  { key: 'reminders', label: 'Reminders',      icon: Bell            },
] as const

type TabKey = typeof TABS[number]['key']

export default function MasterPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabKey>('dashboard')
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const roleCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('portal_role='))
      ?.split('=')[1]
    if (roleCookie !== 'ADMIN') {
      navigate('/portal/home', { replace: true })
      return
    }
    setAuthorized(true)
  }, [navigate])

  if (!authorized) return null

  return (
    <div className="adm-page">
      <div className="adm-header">
        <h1 className="adm-title">Admin Panel</h1>
        <div className="adm-tabs">
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                className={`adm-tab ${tab === t.key ? 'adm-tab--active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                <Icon size={15} />
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="adm-content">
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'locks'     && <LockTab />}
        {tab === 'leave'     && <LeaveTab />}
        {tab === 'users'     && <UsersTab />}
        {tab === 'reminders' && <RemindersTab />}
      </div>
    </div>
  )
}
