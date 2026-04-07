import React, { useState, useEffect } from 'react'
import './TimesheetDrawer.scss'
import { X, Save, Loader2 } from 'lucide-react'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker'
import dayjs, { Dayjs } from 'dayjs'
import { useToast } from '../../context/ToastContext'
import api, { getApiError } from '../../api/client'
import type { TimesheetEntry, DayType, CreateTimesheetPayload } from '../../types/timesheet'

interface TimesheetDrawerProps {
  open: boolean
  onClose: () => void
  onSaved: (entry: TimesheetEntry) => void
  editEntry?: TimesheetEntry | null
}

const DAY_TYPES: DayType[] = ['Working', 'Leave', 'Holiday', 'HalfDay', 'CompOff']
const DAY_LABELS: Record<DayType, string> = {
  Working: 'Working', Leave: 'Leave', Holiday: 'Holiday', HalfDay: 'Half-day', CompOff: 'Comp-off',
}
const HOURS_HIDDEN: DayType[] = ['Leave', 'Holiday']

const defaultForm = () => ({
  client_name:  '',
  project_name: '',
  work_date:    dayjs() as Dayjs,
  type_of_day:  'Working' as DayType,
  hours_worked: 8,
  comments:     '',
})

const TimesheetDrawer: React.FC<TimesheetDrawerProps> = ({ open, onClose, onSaved, editEntry }) => {
  const [form, setForm]       = useState(defaultForm())
  const [saving, setSaving]   = useState(false)
  const [mounted, setMounted] = useState(false)
  const { addToast }          = useToast()

  useEffect(() => {
    if (open) { setMounted(true) }
    else { setTimeout(() => setMounted(false), 420) }
  }, [open])

  useEffect(() => {
    if (editEntry) {
      setForm({
        client_name:  editEntry.client_name  ?? '',
        project_name: editEntry.project_name ?? '',
        work_date:    dayjs(editEntry.work_date),
        type_of_day:  editEntry.type_of_day,
        hours_worked: editEntry.hours_worked ?? 8,
        comments:     editEntry.comments     ?? '',
      })
    } else {
      setForm(defaultForm())
    }
  }, [editEntry, open])

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.work_date?.isValid()) { addToast('Please select a valid date.', 'warning'); return }
    setSaving(true)
    try {
      const payload: CreateTimesheetPayload = {
        client_name:  form.client_name  || undefined,
        project_name: form.project_name || undefined,
        work_date:    form.work_date.format('YYYY-MM-DD'),
        type_of_day:  form.type_of_day,
        hours_worked: HOURS_HIDDEN.includes(form.type_of_day) ? undefined : form.hours_worked,
        comments:     form.comments || undefined,
      }
      const { data: saved } = editEntry
        ? await api.patch(`/timesheets/${editEntry.timesheet_id}`, payload)
        : await api.post('/timesheets', payload)
      onSaved(saved)
      addToast(editEntry ? 'Entry updated.' : 'Entry added.', 'success')
      onClose()
    } catch (err: unknown) {
      addToast(getApiError(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!mounted && !open) return null

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className={`tsd-backdrop${open ? ' tsd-backdrop--visible' : ''}`} onClick={onClose} />
      <div className={`tsd-drawer${open ? ' tsd-drawer--open' : ''}`}>
        <div className="tsd-header">
          <div className="tsd-header-text">
            <h2 className="tsd-title">{editEntry ? 'Edit Entry' : 'Add Entry'}</h2>
            <p className="tsd-subtitle">
              {editEntry ? 'Update your timesheet entry' : 'Log your work for a specific date'}
            </p>
          </div>
          <button className="tsd-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form className="tsd-body" onSubmit={handleSubmit}>
          <div className="tsd-row">
            <div className="tsd-field">
              <label className="tsd-label">Client Name</label>
              <input className="tsd-input" type="text" placeholder="e.g. GSR Group"
                value={form.client_name} onChange={(e) => set('client_name', e.target.value)} />
            </div>
            <div className="tsd-field">
              <label className="tsd-label">Project Name</label>
              <input className="tsd-input" type="text" placeholder="e.g. Community Portal"
                value={form.project_name} onChange={(e) => set('project_name', e.target.value)} />
            </div>
          </div>

          <div className="tsd-field">
            <label className="tsd-label">Work Date <span className="tsd-required">*</span></label>
            <MobileDatePicker
              value={form.work_date}
              onChange={(val) => val && set('work_date', val)}
              format="DD MMM YYYY"
              slotProps={{
                textField: {
                  fullWidth: true, size: 'small',
                  sx: {
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(255,255,255,0.05)', borderRadius: '10px',
                      color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontFamily: 'var(--fontFamily-one)',
                      '& fieldset': { borderColor: 'rgba(59,130,246,0.3)' },
                      '&:hover fieldset': { borderColor: 'rgba(59,130,246,0.55)' },
                      '&.Mui-focused fieldset': { borderColor: 'rgba(59,130,246,0.8)' },
                    },
                    '& .MuiPickersSectionList-root': { color: 'rgba(255,255,255,0.9)' },
                    '& .MuiInputAdornment-root svg': { color: 'rgba(255,255,255,0.4)' },
                  },
                },
              }}
            />
          </div>

          <div className="tsd-field">
            <label className="tsd-label">Type of Day</label>
            <div className="tsd-type-pills">
              {DAY_TYPES.map((t) => (
                <button key={t} type="button"
                  className={`tsd-type-pill${form.type_of_day === t ? ' tsd-type-pill--active' : ''}`}
                  onClick={() => set('type_of_day', t)}>
                  {DAY_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {!HOURS_HIDDEN.includes(form.type_of_day) && (
            <div className="tsd-field">
              <label className="tsd-label">Hours Worked</label>
              <div className="tsd-hours-row">
                <input className="tsd-input tsd-input--hours" type="number" min={0} max={24} step={0.5}
                  value={form.hours_worked}
                  onChange={(e) => set('hours_worked', parseFloat(e.target.value) || 0)} />
                <span className="tsd-hours-unit">hrs</span>
              </div>
            </div>
          )}

          <div className="tsd-field tsd-field--grow">
            <label className="tsd-label">Comments</label>
            <textarea className="tsd-textarea" placeholder="Briefly describe your work..." rows={4}
              value={form.comments} onChange={(e) => set('comments', e.target.value)} />
          </div>
        </form>

        <div className="tsd-footer">
          <button type="button" className="tsd-btn tsd-btn--cancel" onClick={onClose}>Cancel</button>
          <button type="submit" className="tsd-btn tsd-btn--save" disabled={saving} onClick={handleSubmit}>
            {saving ? <Loader2 size={15} className="tsd-spin" /> : <Save size={15} />}
            {saving ? 'Saving…' : editEntry ? 'Update' : 'Add Entry'}
          </button>
        </div>
      </div>
    </LocalizationProvider>
  )
}

export default TimesheetDrawer
