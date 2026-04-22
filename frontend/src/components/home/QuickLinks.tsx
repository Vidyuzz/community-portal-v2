import React from 'react'
import './QuickLinks.scss'
import { Briefcase, Mail } from 'lucide-react'

const links = [
  { label: 'TalentPro',    icon: Briefcase, href: '#', color: '#06B6D4' },
  { label: 'GSR Web Mail', icon: Mail,      href: '#', color: '#10B981' },
]

const QuickLinks: React.FC = () => {
  return (
    <div className="quick-links glass-card">
      <p className="quick-links-title">Quick Access</p>
      <div className="quick-links-grid">
        {links.map((item) => {
          const Icon = item.icon
          return (
            <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className="quick-link-anchor">
              <div className="quick-link-item">
                <div
                  className="quick-link-circle"
                  style={{ '--link-color': item.color, background: `${item.color}12`, border: `1px solid ${item.color}30` } as React.CSSProperties}
                >
                  <Icon size={30} color={item.color} strokeWidth={1.5} />
                </div>
                <span className="quick-link-label">{item.label}</span>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}

export default QuickLinks
