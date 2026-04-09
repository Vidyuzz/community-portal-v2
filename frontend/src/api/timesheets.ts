import api from './client'
import type { TimesheetEntry, CreateTimesheetPayload, ManagerGroupedResponse, ClientSubmissionPayload } from '../types/timesheet'

export async function getTimesheets(): Promise<TimesheetEntry[]> {
  const { data } = await api.get('/timesheets')
  return Array.isArray(data) ? data : []
}

export async function createTimesheet(payload: CreateTimesheetPayload): Promise<TimesheetEntry> {
  const { data } = await api.post('/timesheets', payload)
  return data
}

export async function updateTimesheet(id: number, payload: Partial<CreateTimesheetPayload>): Promise<TimesheetEntry> {
  const { data } = await api.patch(`/timesheets/${id}`, payload)
  return data
}

export async function approveTimesheet(id: number, status: 'Approved' | 'Denied', manager_reason?: string): Promise<TimesheetEntry> {
  const { data } = await api.patch(`/timesheets/${id}`, { status, manager_reason })
  return data
}

export async function deleteTimesheet(id: number): Promise<void> {
  await api.delete(`/timesheets/${id}`)
}

export async function getManagerTimesheets(): Promise<ManagerGroupedResponse[]> {
  const { data } = await api.get('/timesheets', { params: { view: 'manager' } })
  return Array.isArray(data) ? data : []
}

export async function getSubmissions(): Promise<any[]> {
  const { data } = await api.get('/timesheets/submissions')
  return Array.isArray(data) ? data : []
}

export async function submitToClient(payload: ClientSubmissionPayload): Promise<any> {
  const { data } = await api.post('/timesheets/submit-client', payload)
  return data
}
