import api from './client'

export interface TeamUser {
  id: string
  name: string
  email: string
  employeeId: string
  role: string
  designation: string | null
  department: string | null
  managerId: string | null
  managerName?: string | null
  /** ISO date from API */
  createdAt: string | null
  avatarUrl?: string | null
  currentClient: string | null
  timesheetCount: number
}

export async function getTeam(): Promise<TeamUser[]> {
  const { data } = await api.get('/team')
  return Array.isArray(data) ? data : []
}
