import api from './client'
import type { TimesheetEntry, CreateTimesheetPayload, ClientSubmissionPayload } from '../types/timesheet'

export async function getTimesheets(params?: { from?: string; to?: string }): Promise<TimesheetEntry[]> {
  const { data } = await api.get('/timesheets', { params })
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

export async function deleteTimesheet(id: number): Promise<void> {
  await api.delete(`/timesheets/${id}`)
}

export async function getSubmissions(): Promise<any[]> {
  const { data } = await api.get('/timesheets/submissions')
  return Array.isArray(data) ? data : []
}

export async function submitToClient(payload: ClientSubmissionPayload): Promise<any> {
  const { data } = await api.post('/timesheets/submit-client', payload)
  return data
}
