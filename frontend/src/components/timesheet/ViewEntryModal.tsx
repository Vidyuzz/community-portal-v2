import React from 'react'
import './ViewEntryModal.scss'
import { X, CalendarDays, Clock, ClipboardCheck, Timer, Briefcase, Building2 } from 'lucide-react'
import dayjs from 'dayjs'
import StatusBadge from './StatusBadge'
import type { TimesheetEntry, DayType } from '../../types/timesheet'

interface ViewEntryModalProps {
  open: boolean
  entry: TimesheetEntry | null
  onClose: () => void
}

const dayTypeColors: Record<DayType, string> = {
  Working: '#34D399', Leave: '#F87171', Holiday: '#FBB024', HalfDay: '#60A5FA', CompOff: '#60A5FA',
}
const dayTypeLabels: Record<DayType, string> = {
  Working: 'Working', Leave: 'Leave', Holiday: 'Holiday', HalfDay: 'Half-day', CompOff: 'Comp-off',
}

const ViewEntryModal: React.FC<ViewEntryModalProps> = ({ open, entry, onClose }) => {
  if (!open || !entry) return null
  const typeColor = dayTypeColors[entry.type_of_day] ?? '#fff'
  const typeLabel = dayTypeLabels[entry.type_of_day] ?? entry.type_of_day
  const showHours = !['Leave', 'Holiday'].includes(entry.type_of_day)

  return (
    <div className="vem-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="vem-modal glass-card-heavy">
        <div className="vem-header">
          <span className="vem-title">Entry Details</span>
          <button className="vem-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="vem-status-bar">
          <StatusBadge status={entry.status} />
          <span className="vem-read-only-tag">Read Only</span>
        </div>
        <div className="vem-body">
          <div className="vem-field">
            <div className="vem-field-icon" style={{ background: 'rgba(96,165,250,0.1)', borderColor: 'rgba(96,165,250,0.25)' }}>
              <CalendarDays size={14} color="#60A5FA" />
            </div>
            <div className="vem-field-content">
              <span className="vem-field-label">Work Date</span>
              <span className="vem-field-value">{dayjs(entry.work_date).format('dddd, DD MMMM YYYY')}</span>
            </div>
          </div>
          {(entry.client_name || entry.project_name) && (
            <div className="vem-field">
              <div className="vem-field-icon" style={{ background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.25)' }}>
                <Building2 size={14} color="#60A5FA" />
              </div>
              <div className="vem-field-content">
                <span className="vem-field-label">Client / Project</span>
                <span className="vem-field-value">{[entry.client_name, entry.project_name].filter(Boolean).join(' · ')}</span>
              </div>
            </div>
          )}
          <div className="vem-field">
            <div className="vem-field-icon" style={{ background: `${typeColor}18`, borderColor: `${typeColor}33` }}>
              <ClipboardCheck size={14} color={typeColor} />
            </div>
            <div className="vem-field-content">
              <span className="vem-field-label">Type of Day</span>
              <span className="vem-field-value" style={{ color: typeColor }}>{typeLabel}</span>
            </div>
          </div>
          {showHours && entry.hours_worked != null && (
            <div className="vem-field">
              <div className="vem-field-icon" style={{ background: 'rgba(96,165,250,0.1)', borderColor: 'rgba(96,165,250,0.25)' }}>
                <Timer size={14} color="#60A5FA" />
              </div>
              <div className="vem-field-content">
                <span className="vem-field-label">Hours Worked</span>
                <span className="vem-field-value">{entry.hours_worked} hrs</span>
              </div>
            </div>
          )}
          {entry.comments && (
            <div className="vem-task-block">
              <div className="vem-task-header">
                <Clock size={13} color="rgba(255,255,255,0.4)" />
                <span className="vem-field-label">Comments</span>
              </div>
              <p className="vem-task-text">{entry.comments}</p>
            </div>
          )}
          {entry.status === 'Denied' && entry.manager_reason && (
            <div className="vem-task-block" style={{ borderColor: 'rgba(248,113,113,0.25)', background: 'rgba(248,113,113,0.06)' }}>
              <div className="vem-task-header">
                <Briefcase size={13} color="#F87171" />
                <span className="vem-field-label" style={{ color: '#F87171' }}>Manager Reason</span>
              </div>
              <p className="vem-task-text">{entry.manager_reason}</p>
            </div>
          )}
        </div>
        <div className="vem-footer">
          <button className="vem-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default ViewEntryModal
