import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Sidebar.scss'
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  User,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'

interface NavItem {
  url: string
  title: string
  icon: React.FC<{ size?: number; strokeWidth?: number }>
}

const navByRole: Record<string, NavItem[]> = {
  employee: [
    { url: '/portal/home',       title: 'Home',        icon: LayoutDashboard },
    { url: '/portal/tracksheet', title: 'TimeSheet',   icon: ClipboardList },
    { url: '/portal/team',       title: 'Team',        icon: Users },
    { url: '/portal/documents',  title: 'Documents',   icon: FileText },
    { url: '/portal/profile',    title: 'Profile',     icon: User },
  ],
  admin: [
    { url: '/portal/home',       title: 'Home',        icon: LayoutDashboard },
    { url: '/portal/tracksheet', title: 'TimeSheet',   icon: ClipboardList },
    { url: '/portal/team',       title: 'Team',        icon: Users },
    { url: '/portal/master',     title: 'Admin Panel', icon: Settings },
    { url: '/portal/documents',  title: 'Documents',   icon: FileText },
    { url: '/portal/profile',    title: 'Profile',     icon: User },
  ],
}

interface SidebarProps {
  role?: 'employee' | 'admin'
  collapsed: boolean
  onToggle: () => void
}

const Sidebar: React.FC<SidebarProps> = ({
  role = 'employee',
  collapsed,
  onToggle,
}) => {
  const { pathname } = useLocation()
  const items = navByRole[role]

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      {/* Logo area */}
      <div className="sidebar-logo">
        <Link to="/portal/home">
          <img
            src="/assets/GSRlogo.png"
            alt="GSR Logo"
            className={`sidebar-logo-img ${collapsed ? 'sidebar-logo-img--small' : ''}`}
          />
        </Link>
      </div>

      {/* Nav items */}
      <nav className="sidebar-nav">
        {items.map((item) => {
          const Icon = item.icon
          const isActive =
            item.url === '/portal/home'
              ? pathname === '/portal/home'
              : pathname === item.url || pathname.startsWith(item.url + '/')
          return (
            <Link
              key={item.url}
              to={item.url}
              className={`sidebar-item ${isActive ? 'sidebar-item--active' : ''}`}
              title={collapsed ? item.title : undefined}
            >
              <span className="sidebar-item-icon">
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              </span>
              {!collapsed && <span className="sidebar-item-label">{item.title}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <button
        className="sidebar-logout"
        title="Logout"
        onClick={() => {
          document.cookie = 'portal_role=; path=/; max-age=0'
          localStorage.removeItem('portal_role')
          window.location.href = '/login'
        }}
      >
        <span className="sidebar-item-icon"><LogOut size={18} strokeWidth={1.5} /></span>
        {!collapsed && <span className="sidebar-item-label">Logout</span>}
      </button>

      {/* Collapse toggle */}
      <button className="sidebar-toggle" onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}>
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  )
}

export default Sidebar
