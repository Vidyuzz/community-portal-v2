import React from 'react'
import './HolidayWidget.scss'
import { CalendarDays } from 'lucide-react'

const holidays = [
  { date: '14 Apr', name: 'Dr. Ambedkar Jayanti', type: 'National' },
  { date: '01 May', name: 'Labour Day',            type: 'National' },
  { date: '15 Aug', name: 'Independence Day',      type: 'National' },
  { date: '02 Oct', name: 'Gandhi Jayanti',         type: 'National' },
  { date: '01 Nov', name: 'Kannada Rajyotsava',    type: 'Optional' },
  { date: '25 Dec', name: 'Christmas',             type: 'National' },
]

const HolidayWidget: React.FC = () => {
  return (
    <div className="holiday-widget glass-card">
      <div className="widget-header">
        <CalendarDays size={15} color="#34D399" />
        <span className="widget-title">Holiday List 2026</span>
      </div>

      <div className="holiday-list">
        {holidays.map((h, i) => (
          <div key={i} className="holiday-row">
            <span className="holiday-date">{h.date}</span>
            <span className="holiday-name">{h.name}</span>
            <span className={`holiday-badge holiday-badge--${h.type.toLowerCase()}`}>{h.type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HolidayWidget
