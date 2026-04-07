import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './login.scss'
import { Shield, Calendar, Send, Bell, Users, Settings, ChevronDown, ChevronUp, Cloud } from 'lucide-react'

const features = [
  { icon: <Shield size={16} color="#a78bfa" />, label: 'Secure Microsoft SSO', i: 0 },
  { icon: <Calendar size={16} color="#34D399" />, label: 'Timesheet & Leave Tracking', i: 1 },
  { icon: <Send size={16} color="#60A5FA" />, label: 'Client Submission via Email', i: 2 },
  { icon: <Bell size={16} color="#FBB024" />, label: 'Real-time Notifications', i: 3 },
  { icon: <Users size={16} color="#22d3ee" />, label: 'Team Directory & Org Chart', i: 4 },
  { icon: <Settings size={16} color="#f472b6" />, label: 'Admin Control Panel', i: 5 },
]

const LoginPage = () => {
  const [loading, setLoading] = useState(false)
  const [whatsNewOpen, setWhatsNewOpen] = useState(false)

  const handleSignIn = () => {
    setLoading(true)
  }

  const selectRoleAndNavigate = (role: 'ADMIN' | 'EMPLOYEE') => {
    document.cookie = `portal_role=${role}; path=/; max-age=86400; samesite=lax`
    window.localStorage.setItem('portal_role', role)
    window.location.href = '/portal/home'
  }

  return (
    <>
      <div className="loginPage login-outer">

        {/* Animated blobs */}
        <div className="login-blob login-blob-1" />
        <div className="login-blob login-blob-2" />
        <div className="login-blob login-blob-3" />
        <div className="login-blob login-blob-4" />

        {/* Dot grid */}
        <div className="login-dots" />

        {/* Left panel — branding */}
        <aside className="login-brand">
          <div className="login-brand-inner">

            {/* v2.0 badge */}
            <div className="login-v-badge">v2.0</div>

            <img src="/assets/GSRlogo.png" alt="GSR Logo" className="login-logo" />
            <h1 className="login-brand-title">GSR Employee Portal</h1>
            <p className="login-brand-sub">Your unified intranet for timesheets, resources, and more.</p>

            {/* Stats bar */}
            <div className="login-stats">
              <span>300+ Employees</span>
              <span className="login-stats-sep">·</span>
              <span>50+ Clients</span>
              <span className="login-stats-sep">·</span>
              <span>Timesheet Automation</span>
            </div>

            {/* 6-feature grid */}
            <div className="login-features">
              {features.map((f) => (
                <div
                  key={f.i}
                  className="login-feature glass-card-sm"
                  style={{ '--i': f.i } as React.CSSProperties}
                >
                  {f.icon}
                  <span>{f.label}</span>
                </div>
              ))}
            </div>

          </div>
        </aside>

        {/* Right panel */}
        <div className="login-card-wrapper">
          <main className="login-card">
            <div className="login-card-top">
              <h2 className="login-card-title">Welcome back</h2>
              <p className="login-card-sub">Sign in with your GSR Microsoft account to continue.</p>
            </div>

            {/* Microsoft SSO button */}
            <Link to="/portal/home" style={{ width: '100%' }} onClick={handleSignIn}>
              <button className="login-ms-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="login-btn-spinner" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                      <rect x="1"  y="1"  width="9" height="9" fill="#F25022" />
                      <rect x="11" y="1"  width="9" height="9" fill="#7FBA00" />
                      <rect x="1"  y="11" width="9" height="9" fill="#00A4EF" />
                      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                    </svg>
                    <span>Sign in with Microsoft</span>
                  </>
                )}
              </button>
            </Link>

            <div className="login-role-actions">
              <button
                type="button"
                className="login-role-btn login-role-btn--admin"
                onClick={() => selectRoleAndNavigate('ADMIN')}
              >
                admin
              </button>
              <button
                type="button"
                className="login-role-btn"
                onClick={() => selectRoleAndNavigate('EMPLOYEE')}
              >
                emp
              </button>
            </div>

            {/* What's new collapsible */}
            <div className="login-whats-new">
              <button
                className="login-whats-new-toggle"
                onClick={() => setWhatsNewOpen(v => !v)}
              >
                <span>What's new in v2.0</span>
                {whatsNewOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <div className={`login-whats-new-body${whatsNewOpen ? ' open' : ''}`}>
                <ul>
                  <li>Client email approval — clients can approve timesheets directly from their inbox</li>
                  <li>Real-time notification centre with grouped alerts</li>
                  <li>Team directory with org chart view</li>
                </ul>
              </div>
            </div>

            <p className="login-footer-note">
              Use your <strong>@gsrgroup.in</strong> account.<br />
              Contact IT if you have trouble signing in.
            </p>

            {/* Azure footnote */}
            <div className="login-azure-note">
              <Cloud size={12} />
              <span>Powered by Microsoft Azure</span>
            </div>
          </main>
        </div>

      </div>

      {/* Fixed footer bar */}
      <footer className="login-page-footer">
        <span>© 2026 GSR Group</span>
        <span className="sep">·</span>
        <span>Internal Use Only</span>
        <span className="sep">·</span>
        <span>v2.0</span>
      </footer>
    </>
  )
}

export default LoginPage
