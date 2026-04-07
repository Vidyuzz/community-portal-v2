export type AppRole = 'EMPLOYEE' | 'ADMIN'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: AppRole
  employeeId: string
  managerId: string | null
  managerName: string | null
  designation: string
  leave_balance: number
}
