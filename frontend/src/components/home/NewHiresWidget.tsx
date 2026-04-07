import React from 'react'
import './NewHiresWidget.scss'
import { UserPlus } from 'lucide-react'

const newHires = [
  { name: 'Ananya Krishnan', dept: 'Frontend Dev',   joined: '10 Mar' },
  { name: 'Rahul Mehta',     dept: 'QA Engineer',    joined: '12 Mar' },
  { name: 'Divya Patel',     dept: 'HR Executive',   joined: '17 Mar' },
  { name: 'Suresh Iyer',     dept: 'Backend Dev',    joined: '20 Mar' },
  { name: 'Nikita Sharma',   dept: 'UI/UX Designer', joined: '21 Mar' },
]

const initials = (name: string) =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

const avatarColors = ['#3B82F6', '#60A5FA', '#EC4899', '#0EA5E9', '#10B981']

const NewHiresWidget: React.FC = () => {
  return (
    <div className="newhires-widget glass-card">
      <div className="widget-header">
        <UserPlus size={15} color="#60A5FA" />
        <span className="widget-title">New Joiners</span>
      </div>

      <div className="newhires-list">
        {newHires.map((h, i) => (
          <div key={i} className="newhire-item">
            <div
              className="newhire-avatar"
              style={{
                background: `${avatarColors[i % avatarColors.length]}33`,
                borderColor: `${avatarColors[i % avatarColors.length]}55`,
                color: avatarColors[i % avatarColors.length],
              }}
            >
              {initials(h.name)}
            </div>
            <div className="newhire-info">
              <span className="newhire-name">{h.name}</span>
              <span className="newhire-dept">{h.dept}</span>
            </div>
            <span className="newhire-date">{h.joined}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NewHiresWidget
