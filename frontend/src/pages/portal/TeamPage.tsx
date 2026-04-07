import React, { useState, useEffect, useRef, useCallback } from 'react'
import './teamMang.scss'
import { Users, Search, X, Mail, ChevronRight, ChevronDown, LayoutGrid, GitBranch } from 'lucide-react'
import dayjs from 'dayjs'
import { getTeam, type TeamUser } from '@/api/team'

interface TeamMember {
  id:             string
  name:           string
  email:          string
  role:           string
  employeeId:     string
  designation:    string
  department:     string
  managerId:      string | null
  createdAt:      string
  currentClient:  string | null
  timesheetCount: number
}

function mapTeamUser(u: TeamUser): TeamMember {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    employeeId: u.employeeId || '',
    designation: u.designation || 'Employee',
    department: u.department || 'General',
    managerId: u.managerId,
    createdAt: u.createdAt || new Date().toISOString(),
    currentClient: u.currentClient,
    timesheetCount: u.timesheetCount,
  }
}

const AVATAR_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B',
  '#10B981', '#3B82F6', '#EF4444', '#14B8A6',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

const ROLE_COLOR: Record<string, string> = {
  ADMIN:    '#F59E0B',
  EMPLOYEE: '#6EE7B7',
}

function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const bg    = getAvatarColor(name)
  const inits = getInitials(name)
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0,
        fontSize: size * 0.38, fontWeight: 700, color: 'white',
        fontFamily: 'var(--fontFamily-two)',
        boxShadow: `0 2px 8px ${bg}55`,
      }}
    >
      {inits}
    </div>
  )
}

function ProfilePanel({
  member,
  managerName,
  onClose,
}: {
  member: TeamMember
  managerName: string | null
  onClose: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div className="td-profile-overlay">
      <div className="td-profile-panel glass-card" ref={panelRef}>
        <button className="td-profile-close" onClick={onClose}><X size={18} /></button>

        <div className="td-profile-top">
          <Avatar name={member.name} size={64} />
          <div>
            <div className="td-profile-name">{member.name}</div>
            <div className="td-profile-desig">{member.designation}</div>
            <span
              className="td-role-badge"
              style={{ background: `${ROLE_COLOR[member.role]}22`, color: ROLE_COLOR[member.role], border: `1px solid ${ROLE_COLOR[member.role]}55` }}
            >
              {member.role}
            </span>
          </div>
        </div>

        <div className="td-profile-grid">
          {[
            ['Employee ID', member.employeeId || '—'],
            ['Department',  member.department],
            ['Email',       member.email],
            ['Manager',     managerName ?? '—'],
            ['Client',      member.currentClient ?? 'Unassigned'],
            ['Timesheets',  `${member.timesheetCount} entries`],
            ['Joined',      dayjs(member.createdAt).format('DD MMM YYYY')],
          ].map(([label, val]) => (
            <div key={label} className="td-profile-row">
              <span className="td-profile-label">{label}</span>
              <span className="td-profile-val">{val}</span>
            </div>
          ))}
        </div>

        <a href={`mailto:${member.email}`} className="td-send-email-btn">
          <Mail size={14} /> Send Email
        </a>
      </div>
    </div>
  )
}

function MemberCard({ member, onClick }: { member: TeamMember; onClick: () => void }) {
  return (
    <div className="td-card glass-card" onClick={onClick}>
      <div className="td-card-top">
        <Avatar name={member.name} />
        <div className="td-card-info">
          <div className="td-card-name">{member.name}</div>
          <div className="td-card-desig">{member.designation}</div>
          {member.employeeId && (
            <div className="td-card-empid">{member.employeeId}</div>
          )}
        </div>
        <span
          className="td-role-badge td-role-badge--sm"
          style={{ background: `${ROLE_COLOR[member.role]}22`, color: ROLE_COLOR[member.role], border: `1px solid ${ROLE_COLOR[member.role]}55` }}
        >
          {member.role}
        </span>
      </div>

      <div className="td-card-meta">
        <div className="td-card-meta-row">
          <span className="td-card-meta-label">Dept</span>
          <span className="td-card-meta-val">{member.department}</span>
        </div>
        {member.currentClient && (
          <div className="td-card-meta-row">
            <span className="td-card-meta-label">Client</span>
            <span className="td-card-meta-val">{member.currentClient}</span>
          </div>
        )}
        <div className="td-card-meta-row">
          <span className="td-card-meta-label">Email</span>
          <a
            href={`mailto:${member.email}`}
            className="td-card-email"
            onClick={e => e.stopPropagation()}
          >
            {member.email}
          </a>
        </div>
      </div>
    </div>
  )
}

interface OrgNode {
  member:    TeamMember
  children:  OrgNode[]
}

function buildOrgTree(members: TeamMember[]): OrgNode[] {
  const map = new Map<string, OrgNode>()
  for (const m of members) map.set(m.id, { member: m, children: [] })

  const roots: OrgNode[] = []
  for (const m of members) {
    const node = map.get(m.id)!
    if (m.managerId && map.has(m.managerId)) {
      map.get(m.managerId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}

function OrgChartNode({ node, depth = 0 }: { node: OrgNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2)
  const hasChildren = node.children.length > 0

  return (
    <div className={`org-node-wrap ${depth === 0 ? 'org-node-wrap--root' : ''}`}>
      <div
        className={`org-node glass-card ${depth === 0 ? 'org-node--root' : ''}`}
        onClick={() => hasChildren && setExpanded(e => !e)}
        style={{ cursor: hasChildren ? 'pointer' : 'default' }}
      >
        <Avatar name={node.member.name} size={36} />
        <div className="org-node-info">
          <div className="org-node-name">{node.member.name}</div>
          <div className="org-node-desig">{node.member.designation}</div>
        </div>
        {hasChildren && (
          <div className="org-node-chevron">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="org-node-count">{node.children.length}</span>
          </div>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="org-children">
          <div className="org-children-line" />
          <div className="org-children-nodes">
            {node.children.map(child => (
              <OrgChartNode key={child.member.id} node={child} depth={depth + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function TeamPage() {
  const [members,    setMembers]    = useState<TeamMember[]>([])
  const [loading,    setLoading]    = useState(true)
  const [view,       setView]       = useState<'grid' | 'org'>('grid')
  const [search,     setSearch]     = useState('')
  const [deptFilter, setDeptFilter] = useState<string>('All')
  const [selected,   setSelected]   = useState<TeamMember | null>(null)

  useEffect(() => {
    getTeam()
      .then((data) => {
        setMembers(data.map(mapTeamUser))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const departments = ['All', ...Array.from(new Set(members.map(m => m.department))).sort()]

  const filtered = members.filter(m => {
    const q = search.toLowerCase()
    const matchSearch = !q
      || m.name.toLowerCase().includes(q)
      || m.email.toLowerCase().includes(q)
      || m.designation.toLowerCase().includes(q)
      || (m.employeeId ?? '').toLowerCase().includes(q)
    const matchDept = deptFilter === 'All' || m.department === deptFilter
    return matchSearch && matchDept
  })

  const managerMap = new Map(members.map(m => [m.id, m.name]))
  const selectedManager = selected?.managerId ? (managerMap.get(selected.managerId) ?? null) : null

  const orgRoots = buildOrgTree(members)

  return (
    <div className="td-page">
      <div className="td-topbar">
        <div className="td-title-wrap">
          <Users size={20} className="td-title-icon" />
          <h1 className="td-title">Team Directory</h1>
          <span className="td-count-pill">{members.length} members</span>
        </div>

        <div className="td-controls">
          <div className="td-search-wrap">
            <Search size={14} className="td-search-icon" />
            <input
              className="td-search"
              placeholder="Search by name, email, designation…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="td-search-clear" onClick={() => setSearch('')}>
                <X size={12} />
              </button>
            )}
          </div>

          <div className="td-view-toggle">
            <button
              className={`td-view-btn ${view === 'grid' ? 'td-view-btn--active' : ''}`}
              onClick={() => setView('grid')}
            >
              <LayoutGrid size={15} /> Grid
            </button>
            <button
              className={`td-view-btn ${view === 'org' ? 'td-view-btn--active' : ''}`}
              onClick={() => setView('org')}
            >
              <GitBranch size={15} /> Org Chart
            </button>
          </div>
        </div>
      </div>

      {view === 'grid' && (
        <div className="td-dept-pills">
          {departments.map(d => (
            <button
              key={d}
              className={`td-dept-pill ${deptFilter === d ? 'td-dept-pill--active' : ''}`}
              onClick={() => setDeptFilter(d)}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="td-loading">Loading team…</div>
      ) : view === 'grid' ? (
        filtered.length === 0 ? (
          <div className="td-empty">No members match your search.</div>
        ) : (
          <div className="td-grid">
            {filtered.map(m => (
              <MemberCard key={m.id} member={m} onClick={() => setSelected(m)} />
            ))}
          </div>
        )
      ) : (
        <div className="td-org-wrap">
          <div className="td-org-chart">
            {orgRoots.map(node => (
              <OrgChartNode key={node.member.id} node={node} depth={0} />
            ))}
          </div>
        </div>
      )}

      {selected && (
        <ProfilePanel
          member={selected}
          managerName={selectedManager}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
