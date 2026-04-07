import React, { useState, useEffect } from 'react'
import './SubmitToClientDrawer.scss'
import { X, Send, Loader2, CalendarRange } from 'lucide-react'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker'
import dayjs, { Dayjs } from 'dayjs'
import { useToast } from '../../context/ToastContext'
import { generateTimesheetCSV, getTimesheetFilename } from '../../lib/csv'
import type { TimesheetEntry } from '../../types/timesheet'

interface SubmitToClientDrawerProps {
  open: boolean
  onClose: () => void
  entries: TimesheetEntry[]
  user: {
    name: string
    employeeId: string
    managerName: string
  }
}

const datePickerSx = {
  '& .MuiOutlinedInput-root': {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '10px',
    color: 'rgba(255,255,255,0.9)',
    fontSize: '14px',
    fontFamily: 'var(--fontFamily-one)',
    '& fieldset': { borderColor: 'rgba(59,130,246,0.3)' },
    '&:hover fieldset': { borderColor: 'rgba(59,130,246,0.55)' },
    '&.Mui-focused fieldset': { borderColor: 'rgba(59,130,246,0.8)' },
  },
  '& .MuiPickersSectionList-root': { color: 'rgba(255,255,255,0.9)' },
  '& .MuiPickersSectionList-section': { color: 'rgba(255,255,255,0.9)' },
  '& .MuiPickersSectionList-sectionContent': { color: 'rgba(255,255,255,0.9)' },
  '& .MuiPickersSectionList-separator': { color: 'rgba(255,255,255,0.5)' },
  '& .MuiInputAdornment-root svg': { color: 'rgba(255,255,255,0.4)' },
}

const SubmitToClientDrawer: React.FC<SubmitToClientDrawerProps> = ({
  open,
  onClose,
  entries,
  user,
}) => {
  const [form, setForm] = useState({
    client_name:          '',
    client_manager_name:  '',
    client_manager_email: '',
    from_date:            dayjs().startOf('month') as Dayjs,
    to_date:              dayjs().endOf('month') as Dayjs,
  })
  const [submitting, setSubmitting] = useState(false)
  const [mounted, setMounted]       = useState(false)
  const { addToast }                = useToast()

  useEffect(() => {
    if (open) setMounted(true)
    else setTimeout(() => setMounted(false), 420)
  }, [open])

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const filteredEntries = entries.filter((e) => {
    const d = dayjs(e.work_date)
    return d.isAfter(form.from_date.subtract(1, 'day')) && d.isBefore(form.to_date.add(1, 'day'))
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.client_name.trim() || !form.client_manager_name.trim() || !form.client_manager_email.trim()) {
      addToast('All fields are required.', 'warning')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.client_manager_email)) {
      addToast('Enter a valid client manager email.', 'warning')
      return
    }
    if (filteredEntries.length === 0) {
      addToast('No timesheet entries found in the selected date range.', 'warning')
      return
    }

    setSubmitting(true)
    try {
      const fromStr = form.from_date.format('YYYY-MM-DD')
      const toStr   = form.to_date.format('YYYY-MM-DD')

      const csvContent = generateTimesheetCSV(filteredEntries, user)
      const csvBase64  = btoa(unescape(encodeURIComponent(csvContent)))

      const res = await fetch('/api/timesheets/submit-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          client_name:          form.client_name.trim(),
          client_manager_name:  form.client_manager_name.trim(),
          client_manager_email: form.client_manager_email.trim(),
          from_date:            fromStr,
          to_date:              toStr,
          csv_content:          csvBase64,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail ?? err.error ?? 'Submission failed')
      }

      addToast(`Timesheet submitted to ${form.client_manager_name}!`, 'success')
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      addToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!mounted && !open) return null

  const filename = getTimesheetFilename(
    user.employeeId,
    form.from_date.format('YYYY-MM-DD'),
    form.to_date.format('YYYY-MM-DD')
  )

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div
        className={`stcd-backdrop${open ? ' stcd-backdrop--visible' : ''}`}
        onClick={onClose}
      />

      <div className={`stcd-drawer${open ? ' stcd-drawer--open' : ''}`}>
        <div className="stcd-header">
          <div className="stcd-header-icon">
            <Send size={18} />
          </div>
          <div className="stcd-header-text">
            <h2 className="stcd-title">Submit to Client</h2>
            <p className="stcd-subtitle">Send your timesheet directly to your client manager</p>
          </div>
          <button className="stcd-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form className="stcd-body" onSubmit={handleSubmit}>
          <div className="stcd-section-label">
            <CalendarRange size={14} />
            Timesheet Period
          </div>
          <div className="stcd-row">
            <div className="stcd-field">
              <label className="stcd-label">From Date</label>
              <MobileDatePicker
                value={form.from_date}
                onChange={(val) => val && set('from_date', val)}
                format="DD MMM YYYY"
                slotProps={{ textField: { fullWidth: true, size: 'small', sx: datePickerSx } }}
              />
            </div>
            <div className="stcd-field">
              <label className="stcd-label">To Date</label>
              <MobileDatePicker
                value={form.to_date}
                onChange={(val) => val && set('to_date', val)}
                format="DD MMM YYYY"
                slotProps={{ textField: { fullWidth: true, size: 'small', sx: datePickerSx } }}
              />
            </div>
          </div>

          <div className="stcd-entry-count">
            <span className="stcd-entry-count-num">{filteredEntries.length}</span>
            {' '}entries in this range · file will be <code className="stcd-filename">{filename}</code>
          </div>

          <div className="stcd-section-label">
            <Send size={14} />
            Client Details
          </div>

          <div className="stcd-field">
            <label className="stcd-label">Client Name <span className="stcd-required">*</span></label>
            <input
              className="stcd-input"
              type="text"
              placeholder="e.g. Siemens"
              value={form.client_name}
              onChange={(e) => set('client_name', e.target.value)}
              required
            />
          </div>

          <div className="stcd-field">
            <label className="stcd-label">Client Manager Name <span className="stcd-required">*</span></label>
            <input
              className="stcd-input"
              type="text"
              placeholder="e.g. Rajkumar"
              value={form.client_manager_name}
              onChange={(e) => set('client_manager_name', e.target.value)}
              required
            />
          </div>

          <div className="stcd-field">
            <label className="stcd-label">Client Manager Email <span className="stcd-required">*</span></label>
            <input
              className="stcd-input"
              type="email"
              placeholder="e.g. manager@siemens.com"
              value={form.client_manager_email}
              onChange={(e) => set('client_manager_email', e.target.value)}
              required
            />
          </div>
        </form>

        <div className="stcd-footer">
          <button type="button" className="stcd-btn stcd-btn--cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="stcd-btn stcd-btn--submit"
            disabled={submitting || filteredEntries.length === 0}
            onClick={handleSubmit}
          >
            {submitting ? <Loader2 size={15} className="stcd-spin" /> : <Send size={15} />}
            {submitting ? 'Sending…' : 'Submit Timesheet'}
          </button>
        </div>
      </div>
    </LocalizationProvider>
  )
}

export default SubmitToClientDrawer
