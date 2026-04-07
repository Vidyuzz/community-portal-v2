import React from 'react'
import './BirthdayWidget.scss'
import { Cake, Star } from 'lucide-react'

const milestones = [
  { name: 'Ajith Kumar',  type: 'birthday', sub: 'Birthday Today 🎂' },
  { name: 'Priya Rajan',  type: 'work',     sub: '5 Years at GSR 🎉' },
  { name: 'Dinesh V.',    type: 'birthday', sub: 'Birthday Tomorrow' },
  { name: 'Meena S.',     type: 'work',     sub: '3 Years at GSR' },
  { name: 'Karthik N.',   type: 'birthday', sub: 'Birthday This Week' },
]

const initials = (name: string) =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

const BirthdayWidget: React.FC = () => {
  return (
    <div className="bday-widget glass-card">
      <div className="widget-header">
        <Cake size={15} color="#F472B6" />
        <span className="widget-title">Milestones</span>
      </div>

      <div className="bday-list">
        {milestones.map((m, i) => (
          <div key={i} className="bday-item">
            <div className={`bday-avatar bday-avatar--${m.type}`}>
              {m.type === 'birthday' ? <Cake size={14} /> : <Star size={14} />}
              <span>{initials(m.name)}</span>
            </div>
            <div className="bday-info">
              <span className="bday-name">{m.name}</span>
              <span className="bday-sub">{m.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BirthdayWidget
