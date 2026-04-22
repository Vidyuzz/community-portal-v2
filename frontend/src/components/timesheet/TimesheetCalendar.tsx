import React, { useState } from 'react'
import './TimesheetCalendar.scss'
import dayjs, { Dayjs } from 'dayjs'
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react'
import type { TimesheetEntry } from '../../types/timesheet'

interface Props {
  entries: TimesheetEntry[]
  lockedMonths?: { year: number; month: number }[]
  onDayClick: (date: string, existing?: TimesheetEntry) => void
}

const TYPE_COLOR: Record<string, string> = {
  Working: '#60A5FA', Leave: '#F87171', Holiday: '#FBB024', HalfDay: '#a78bfa', CompOff: '#22d3ee',
}
const TYPE_LABEL: Record<string, string> = {
  Working: 'Work', Leave: 'Leave', Holiday: 'Holiday', HalfDay: 'Half', CompOff: 'CompOff',
}

function buildCalendarGrid(month: Dayjs): (Dayjs | null)[][] {
  const start = month.startOf('month')
  const end   = month.endOf('month')
  const startDow = (start.day() + 6) % 7
  const days: (Dayjs | null)[] = []
  for (let i = 0; i < startDow; i++) days.push(null)
  for (let d = start; !d.isAfter(end); d = d.add(1, 'day')) days.push(d)
  while (days.length % 7 !== 0) days.push(null)
  const weeks: (Dayjs | null)[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  return weeks
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const TimesheetCalendar: React.FC<Props> = ({ entries, lockedMonths = [], onDayClick }) => {
  const [viewMonth, setViewMonth] = useState(dayjs().startOf('month'))
  const today = dayjs().format('YYYY-MM-DD')

  const entryByDate: Record<string, TimesheetEntry> = {}
  for (const e of entries) {
    entryByDate[dayjs(e.work_date).format('YYYY-MM-DD')] = e
  }

  const isLocked = (d: Dayjs) =>
    lockedMonths.some(l => l.year === d.year() && l.month === d.month() + 1)

  const weeks = buildCalendarGrid(viewMonth)

  return (
    <div className="ts-calendar glass-card">
      <div className="ts-cal-header">
        <button className="ts-cal-nav" onClick={() => setViewMonth(v => v.subtract(1, 'month'))}>
          <ChevronLeft size={16} />
        </button>
        <span className="ts-cal-month-label">{viewMonth.format('MMMM YYYY')}</span>
        <button className="ts-cal-nav" onClick={() => setViewMonth(v => v.add(1, 'month'))}>
          <ChevronRight size={16} />
        </button>
        <button className="ts-cal-today-btn" onClick={() => setViewMonth(dayjs().startOf('month'))}>
          Today
        </button>
      </div>

      <div className="ts-cal-dow-row">
        {WEEKDAYS.map(d => <div key={d} className="ts-cal-dow">{d}</div>)}
      </div>

      {weeks.map((week, wi) => (
        <div key={wi} className="ts-cal-week">
          {week.map((day, di) => {
            if (!day) return <div key={di} className="ts-cal-day ts-cal-day--empty" />
            const dateStr = day.format('YYYY-MM-DD')
            const entry   = entryByDate[dateStr]
            const locked  = isLocked(day)
            const isToday = dateStr === today
            const inView  = day.month() === viewMonth.month()
            return (
              <div
                key={di}
                className={[
                  'ts-cal-day',
                  isToday ? 'ts-cal-day--today' : '',
                  !inView ? 'ts-cal-day--overflow' : '',
                  locked  ? 'ts-cal-day--locked' : '',
                  entry   ? 'ts-cal-day--has-entry' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => !locked && onDayClick(dateStr, entry)}
              >
                <span className="ts-cal-day-num">{day.date()}</span>
                {entry && (
                  <div className="ts-cal-chip"
                    style={{ background: `${TYPE_COLOR[entry.type_of_day]}22`, borderColor: TYPE_COLOR[entry.type_of_day] }}>
                    <span className="ts-cal-dot" style={{ background: TYPE_COLOR[entry.type_of_day] }} />
                    <span style={{ color: TYPE_COLOR[entry.type_of_day] }}>{TYPE_LABEL[entry.type_of_day]}</span>
                    {entry.hours_worked != null && <span className="ts-cal-hours">{entry.hours_worked}h</span>}
                  </div>
                )}
                {locked && <div className="ts-cal-lock-overlay"><Lock size={10} color="rgba(255,255,255,0.35)" /></div>}
              </div>
            )
          })}
        </div>
      ))}

      <div className="ts-cal-legend">
        {Object.entries(TYPE_COLOR).map(([type, color]) => (
          <span key={type} className="ts-cal-legend-item">
            <span className="ts-cal-dot" style={{ background: color }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{type}</span>
          </span>
        ))}
        <span className="ts-cal-legend-item">
          <Lock size={10} color="rgba(255,255,255,0.3)" />
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Locked</span>
        </span>
      </div>
    </div>
  )
}

export default TimesheetCalendar
