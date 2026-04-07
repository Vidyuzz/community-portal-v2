import React from 'react'
import { Link } from 'react-router-dom'
import './QuickLinks.scss'
import { ClipboardList, Briefcase, Mail, ShieldCheck, FileCheck2, BookOpen } from 'lucide-react'

const links = [
  { label: 'Timesheet',    icon: ClipboardList, href: '/portal/tracksheet', internal: true,  color: '#3B82F6' },
  { label: 'TalentPro',   icon: Briefcase,     href: '#',                  internal: false, color: '#06B6D4' },
  { label: 'GSR Web Mail', icon: Mail,          href: '#',                  internal: false, color: '#10B981' },
  { label: 'Info Security',icon: ShieldCheck,   href: '#',                  internal: false, color: '#F59E0B' },
  { label: 'ISMS Test',    icon: FileCheck2,    href: '#',                  internal: false, color: '#EF4444' },
  { label: 'Policy Docs',  icon: BookOpen,      href: '/portal/documents',  internal: true,  color: '#3B82F6' },
]

const QuickLinks: React.FC = () => {
  return (
    <div className="quick-links glass-card">
      <p className="quick-links-title">Quick Access</p>
      <div className="quick-links-grid">
        {links.map((item) => {
          const Icon = item.icon
          const inner = (
            <div className="quick-link-item">
              <div
                className="quick-link-circle"
                style={{ '--link-color': item.color, background: `${item.color}12`, border: `1px solid ${item.color}30` } as React.CSSProperties}
              >
                <Icon size={24} color={item.color} strokeWidth={1.5} />
              </div>
              <span className="quick-link-label">{item.label}</span>
            </div>
          )
          return item.internal ? (
            <Link key={item.label} to={item.href} className="quick-link-anchor">{inner}</Link>
          ) : (
            <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className="quick-link-anchor">{inner}</a>
          )
        })}
      </div>
    </div>
  )
}

export default QuickLinks
