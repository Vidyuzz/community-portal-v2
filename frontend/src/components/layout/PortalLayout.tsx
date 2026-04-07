import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, Outlet } from 'react-router-dom'
import './PortalLayout.scss'
import TopNav from './TopNav'
import './TopNav.scss'
import Sidebar from './Sidebar'
import './Sidebar.scss'

const PortalLayout: React.FC = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userRole, setUserRole] = useState<'employee' | 'admin'>('employee')

  useEffect(() => {
    const roleCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('portal_role='))
      ?.split('=')[1]
    const role = roleCookie === 'ADMIN' ? 'admin' : 'employee'
    setUserRole(role)
    if (pathname.startsWith('/portal/master') && role !== 'admin') {
      navigate('/portal/home', { replace: true })
    }
    if (pathname.startsWith('/portal/tracksheet/manager') && role !== 'admin') {
      navigate('/portal/home', { replace: true })
    }
  }, [pathname, navigate])

  // Derive current page name for breadcrumb
  const getPageName = () => {
    if (pathname.includes('/tracksheet')) return 'TimeSheet'
    if (pathname.includes('/team')) return 'Team'
    if (pathname.includes('/master')) return 'Admin Panel'
    if (pathname.includes('/documents')) return 'Documents'
    if (pathname.includes('/profile')) return 'Profile'
    if (pathname.includes('/dashboard')) return 'Dashboard'
    if (pathname.includes('/careers')) return 'Careers'
    if (pathname.includes('/onboard')) return 'Onboarding'
    return 'Home'
  }

  return (
    <div className="portal-shell">
      {/* Sidebar */}
      <Sidebar
        role={userRole}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main area (header + content) */}
      <div
        className="portal-main"
        style={{
          marginLeft: sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
        }}
      >
        {/* Header */}
        <header className="portal-header">
          <div className="portal-header-left">
            <div className="portal-breadcrumb">
              <span className="portal-breadcrumb-root">Portal</span>
              <span className="portal-breadcrumb-sep">/</span>
              <span className="portal-breadcrumb-current">{getPageName()}</span>
            </div>
          </div>

          <div className="portal-header-right">
            <TopNav
              userRole={
                userRole === 'admin' ? 'Admin' : 'Employee'
              }
            />
          </div>
        </header>

        {/* Page content */}
        <main className="portal-content">
          <div className="portal-content-inner"><Outlet /></div>
        </main>
      </div>
    </div>
  )
}

export default PortalLayout
