import { Navigate } from 'react-router-dom'

function getPortalRole(): string | undefined {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('portal_role='))
    ?.split('=')[1]
}

export default function RootRedirect() {
  const role = getPortalRole()
  if (role === 'ADMIN' || role === 'EMPLOYEE') {
    return <Navigate to="/portal/home" replace />
  }
  return <Navigate to="/login" replace />
}
