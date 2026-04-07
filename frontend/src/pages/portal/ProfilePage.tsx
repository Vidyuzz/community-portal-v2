import React from 'react'
import './profile.scss'
import dayjs from 'dayjs'
import {
  User, Mail, Phone, MapPin, Building2, Briefcase,
  CalendarDays, Users, Heart, Shield, ChevronRight,
} from 'lucide-react'

const employee = {
  name: 'Raj Kumar',
  initials: 'RK',
  designation: 'Senior Frontend Developer',
  department: 'Engineering',
  employeeId: 'GSR-2045',
  email: 'raj.kumar@gsrgroup.in',
  phone: '+91 98765 43210',
  location: 'Bengaluru, Karnataka',
  joinDate: '2022-04-11',
  workType: 'Hybrid',
  avatarColor: '#3B82F6',

  manager: {
    name: 'Priya Rajan',
    initials: 'PR',
    designation: 'Engineering Manager',
    email: 'priya.rajan@gsrgroup.in',
    avatarColor: '#06B6D4',
  },

  team: [
    { name: 'Ananya Krishnan', role: 'Frontend Dev',    initials: 'AK', color: '#3B82F6' },
    { name: 'Rahul Mehta',     role: 'QA Engineer',     initials: 'RM', color: '#0EA5E9' },
    { name: 'Suresh Iyer',     role: 'Backend Dev',     initials: 'SI', color: '#10B981' },
    { name: 'Nikita Sharma',   role: 'UI/UX Designer',  initials: 'NS', color: '#F472B6' },
  ],

  family: [
    { relation: 'Spouse',  name: 'Divya Kumar',    dob: '1993-07-18' },
    { relation: 'Son',     name: 'Arjun Kumar',    dob: '2020-01-05' },
    { relation: 'Father',  name: 'Mohan Kumar',    dob: '1962-03-22' },
    { relation: 'Mother',  name: 'Saroja Kumar',   dob: '1965-09-14' },
  ],

  skills: ['React', 'Next.js', 'TypeScript', 'SCSS', 'Node.js', 'Figma'],
}

function Field({ icon: Icon, label, value, color = 'rgba(255,255,255,0.4)' }: { icon: React.ElementType; label: string; value: string; color?: string }) {
  return (
    <div className="prof-field">
      <div className="prof-field-icon-wrap" style={{ background: `${color}15`, borderColor: `${color}30` }}>
        <Icon size={14} color={color} />
      </div>
      <div className="prof-field-content">
        <span className="prof-field-label">{label}</span>
        <span className="prof-field-value">{value}</span>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const tenure = dayjs().diff(dayjs(employee.joinDate), 'year')

  return (
    <div className="prof-page page-enter">

      <div className="prof-hero glass-card">
        <div className="prof-hero-avatar" style={{ background: `${employee.avatarColor}22`, borderColor: `${employee.avatarColor}55`, color: employee.avatarColor }}>
          {employee.initials}
        </div>
        <div className="prof-hero-info">
          <h1 className="prof-name">{employee.name}</h1>
          <p className="prof-designation">{employee.designation}</p>
          <div className="prof-chips">
            <span className="prof-chip prof-chip--dept">
              <Building2 size={11} /> {employee.department}
            </span>
            <span className="prof-chip prof-chip--id">
              {employee.employeeId}
            </span>
            <span className="prof-chip prof-chip--work">
              {employee.workType}
            </span>
            <span className="prof-chip prof-chip--tenure">
              {tenure} yr{tenure !== 1 ? 's' : ''} at GSR
            </span>
          </div>
        </div>

        <div className="prof-skills">
          <span className="prof-skills-label">Skills</span>
          <div className="prof-skills-wrap">
            {employee.skills.map((s) => (
              <span key={s} className="prof-skill-tag">{s}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="prof-grid">

        <div className="prof-section glass-card">
          <div className="prof-section-header">
            <User size={14} color={employee.avatarColor} />
            <span className="prof-section-title">Contact Information</span>
            <span className="prof-readonly-tag">Read Only</span>
          </div>
          <div className="prof-fields">
            <Field icon={Mail}       label="Email"      value={employee.email}    color="#60A5FA" />
            <Field icon={Phone}      label="Phone"      value={employee.phone}    color="#34D399" />
            <Field icon={MapPin}     label="Location"   value={employee.location} color="#F472B6" />
            <Field icon={CalendarDays} label="Joined"   value={dayjs(employee.joinDate).format('DD MMMM YYYY')} color="#FBB024" />
          </div>
        </div>

        <div className="prof-section glass-card">
          <div className="prof-section-header">
            <Briefcase size={14} color="#60A5FA" />
            <span className="prof-section-title">Reporting Manager</span>
          </div>
          <div className="prof-manager-card glass-card-sm">
            <div className="prof-member-avatar" style={{ background: `${employee.manager.avatarColor}22`, borderColor: `${employee.manager.avatarColor}44`, color: employee.manager.avatarColor }}>
              {employee.manager.initials}
            </div>
            <div className="prof-member-info">
              <span className="prof-member-name">{employee.manager.name}</span>
              <span className="prof-member-role">{employee.manager.designation}</span>
              <a href={`mailto:${employee.manager.email}`} className="prof-member-email">{employee.manager.email}</a>
            </div>
            <ChevronRight size={15} color="rgba(255,255,255,0.2)" />
          </div>

          <div className="prof-section-header" style={{ marginTop: 16 }}>
            <Users size={14} color="#60A5FA" />
            <span className="prof-section-title">Team Members</span>
          </div>
          <div className="prof-team-list">
            {employee.team.map((m) => (
              <div key={m.name} className="prof-team-item glass-card-sm">
                <div className="prof-member-avatar prof-member-avatar--sm" style={{ background: `${m.color}22`, borderColor: `${m.color}44`, color: m.color }}>
                  {m.initials}
                </div>
                <div className="prof-member-info">
                  <span className="prof-member-name prof-member-name--sm">{m.name}</span>
                  <span className="prof-member-role">{m.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="prof-section glass-card">
          <div className="prof-section-header">
            <Heart size={14} color="#F472B6" />
            <span className="prof-section-title">Family Information</span>
            <span className="prof-readonly-tag">Read Only</span>
          </div>
          <div className="prof-family-list">
            {employee.family.map((f) => (
              <div key={f.name} className="prof-family-row">
                <span className="prof-family-relation">{f.relation}</span>
                <span className="prof-family-name">{f.name}</span>
                <span className="prof-family-dob">{dayjs(f.dob).format('DD MMM YYYY')}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="prof-section glass-card">
          <div className="prof-section-header">
            <Shield size={14} color="#34D399" />
            <span className="prof-section-title">Account & Security</span>
          </div>
          <div className="prof-security-items">
            {[
              { label: 'Microsoft Account',  value: employee.email,  status: 'Connected', statusColor: '#34D399' },
              { label: 'MFA',                value: 'Authenticator App', status: 'Active', statusColor: '#34D399' },
              { label: 'Last Login',         value: 'Today, 9:14 AM', status: null, statusColor: '' },
              { label: 'Role',               value: 'Employee',      status: null, statusColor: '' },
            ].map((item) => (
              <div key={item.label} className="prof-security-row glass-card-sm">
                <div className="prof-security-info">
                  <span className="prof-security-label">{item.label}</span>
                  <span className="prof-security-value">{item.value}</span>
                </div>
                {item.status && (
                  <span className="prof-status-pill" style={{ background: `${item.statusColor}18`, borderColor: `${item.statusColor}35`, color: item.statusColor }}>
                    {item.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
