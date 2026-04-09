import api from './client'

/** Matches GET /api/admin/stats (Next.js + FastAPI). */
export interface AdminStats {
  totalEmployees: number
  submissionsThisMonth: number
  lockedMonths: number
  pendingTimesheets: number
}

export interface AdminUser {
  id: string
  name: string
  email: string
  employeeId: string | null
  role: string
  designation: string | null
  department: string | null
  managerId: string | null
  leave_balance: number
  manager: { name: string } | null
  createdAt?: string | null
}

export interface MonthLock {
  id: number
  year: number
  month: number
  locked_by: string
  locked_at: string | null
}

export async function getStats(): Promise<AdminStats> {
  const { data } = await api.get('/admin/stats')
  return data
}

export async function getUsers(): Promise<AdminUser[]> {
  const { data } = await api.get('/admin/users')
  return Array.isArray(data) ? data : []
}

export async function updateUser(
  id: string,
  payload: Partial<
    Pick<
      AdminUser,
      'designation' | 'department' | 'role' | 'leave_balance' | 'employeeId'
    > & { managerId?: string | null }
  >
): Promise<AdminUser> {
  const { data } = await api.patch(`/admin/users/${id}`, payload)
  return data
}

export async function getLocks(): Promise<MonthLock[]> {
  const { data } = await api.get('/admin/locks')
  return Array.isArray(data) ? data : []
}

export async function createLock(year: number, month: number): Promise<MonthLock> {
  const { data } = await api.post('/admin/locks', { year, month })
  return data
}

export async function deleteLock(id: number): Promise<void> {
  await api.delete(`/admin/locks/${id}`)
}

export async function bulkCredit(amount: number): Promise<{ updated: number; amount: number }> {
  const { data } = await api.post('/admin/leave/bulk-credit', { amount })
  return data
}

export async function sendReminders(type: 'weekly' | 'monthly'): Promise<{ sent: number; skipped: number }> {
  const { data } = await api.post('/reminders/send', { type })
  return data
}

export async function getLeaveBalance(): Promise<{ balance: number }> {
  const { data } = await api.get('/leave-balance')
  return data
}
