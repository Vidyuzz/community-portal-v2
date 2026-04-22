export type DayType = 'Working' | 'Leave' | 'Holiday' | 'HalfDay' | 'CompOff'
export type UserRole = 'EMPLOYEE' | 'ADMIN'

export interface TimesheetEntry {
  timesheet_id: number
  user_id: string
  client_name: string | null
  project_name: string | null
  work_date: string
  type_of_day: DayType
  hours_worked: number | null
  comments: string | null
  created_at: string | null
  updated_at: string
  user?: {
    name: string
    email: string
  }
}

export interface CreateTimesheetPayload {
  client_name?: string
  project_name?: string
  work_date: string
  type_of_day: DayType
  hours_worked?: number
  comments?: string
}

export interface ManagerGroupedResponse {
  user_id: string
  full_name: string
  email: string
  entries: TimesheetEntry[]
}

export interface ClientSubmissionPayload {
  client_name: string
  client_manager_name: string
  client_manager_email: string
  from_date: string
  to_date: string
  csv_content: string
}

export interface MockUser {
  id: string
  name: string
  email: string
  employeeId: string
  managerId: string
  managerName: string
  designation: string
  leave_balance: number
}
