import * as XLSX from 'xlsx'
import type { TimesheetEntry } from '../types/timesheet'

interface CsvUser {
  name: string
  employeeId: string
  managerName: string
}

export function generateTimesheetCSV(entries: TimesheetEntry[], user: CsvUser): string {
  const headers = [
    'Date', 'Day', 'Employee ID', 'Employee Name', 'Reporting Manager Name',
    'Client Name', 'Project Name', 'Day Type', 'Hours', 'Comments',
  ]
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const rows = entries.map((e) => {
    const date = new Date(e.work_date)
    const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const dayName = dayNames[date.getDay()]
    return [
      dateStr, dayName, user.employeeId, user.name, user.managerName,
      e.client_name ?? '', e.project_name ?? '', e.type_of_day,
      e.hours_worked != null ? String(e.hours_worked) : '', e.comments ?? '',
    ].map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')
  })
  return [headers.join(','), ...rows].join('\r\n')
}

/** Same columns as the CSV, as a real spreadsheet, base64-encoded for the mail attachment. */
export function generateTimesheetXLSXBase64(entries: TimesheetEntry[], user: CsvUser): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const rows = entries.map((e) => {
    const date = new Date(e.work_date)
    return {
      'Date': date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      'Day': dayNames[date.getDay()],
      'Employee ID': user.employeeId,
      'Employee Name': user.name,
      'Reporting Manager Name': user.managerName,
      'Client Name': e.client_name ?? '',
      'Project Name': e.project_name ?? '',
      'Day Type': e.type_of_day,
      'Hours': e.hours_worked ?? '',
      'Comments': e.comments ?? '',
    }
  })
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Timesheet')
  return XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
}

export function getTimesheetFilename(
  employeeId: string, fromDate: string, toDate: string, ext: 'csv' | 'xlsx' = 'csv',
): string {
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB').replace(/\//g, '-')
  return `${employeeId}_Timesheet_${fmt(fromDate)}_to_${fmt(toDate)}.${ext}`
}
