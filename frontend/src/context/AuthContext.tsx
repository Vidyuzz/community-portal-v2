import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { AppRole } from '../types/auth'

interface AuthCtx {
  role: AppRole
  setRole: (r: AppRole) => void
}

const AuthContext = createContext<AuthCtx>({ role: 'EMPLOYEE', setRole: () => {} })

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<AppRole>('EMPLOYEE')

  useEffect(() => {
    const c = document.cookie
      .split('; ')
      .find((r) => r.startsWith('portal_role='))
      ?.split('=')[1]
    if (c === 'ADMIN') setRoleState('ADMIN')
    else setRoleState('EMPLOYEE')
  }, [])

  const setRole = (r: AppRole) => {
    document.cookie = `portal_role=${r}; path=/; max-age=86400; samesite=lax`
    window.localStorage.setItem('portal_role', r)
    setRoleState(r)
  }

  return (
    <AuthContext.Provider value={{ role, setRole }}>
      {children}
    </AuthContext.Provider>
  )
}
