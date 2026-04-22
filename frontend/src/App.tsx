import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Layout
import PortalLayout from './components/layout/PortalLayout'

// Pages
import LoginPage from './pages/LoginPage'
import RootRedirect from './pages/RootRedirect'
import HomePage from './pages/portal/HomePage'
import TracksheetPage from './pages/portal/TracksheetPage'
import TeamPage from './pages/portal/TeamPage'
import ProfilePage from './pages/portal/ProfilePage'
import MasterPage from './pages/portal/MasterPage'
import DashboardPage from './pages/portal/DashboardPage'
import DocumentsPage from './pages/portal/DocumentsPage'
import CareersPage from './pages/portal/CareersPage'
import ReferralPage from './pages/portal/ReferralPage'
import OnboardPage from './pages/portal/OnboardPage'

// Client approval pages
import AlreadyRespondedPage from './pages/client-approval/AlreadyRespondedPage'
import ConfirmedPage from './pages/client-approval/ConfirmedPage'
import InvalidPage from './pages/client-approval/InvalidPage'

const App: React.FC = () => (
  <Routes>
    {/* Public */}
    <Route path="/" element={<RootRedirect />} />
    <Route path="/login" element={<LoginPage />} />

    {/* Client approval (public, no layout) */}
    <Route path="/client-approval/already-responded" element={<AlreadyRespondedPage />} />
    <Route path="/client-approval/confirmed" element={<ConfirmedPage />} />
    <Route path="/client-approval/invalid" element={<InvalidPage />} />

    {/* Portal (protected layout) */}
    <Route path="/portal" element={<PortalLayout />}>
      <Route path="home" element={<HomePage />} />
      <Route path="tracksheet" element={<TracksheetPage />} />
      <Route path="team" element={<TeamPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="master" element={<MasterPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="documents" element={<DocumentsPage />} />
      <Route path="careers" element={<CareersPage />} />
      <Route path="careers/referral" element={<ReferralPage />} />
      <Route path="onboard" element={<OnboardPage />} />
      <Route index element={<Navigate to="home" replace />} />
    </Route>
  </Routes>
)

export default App
