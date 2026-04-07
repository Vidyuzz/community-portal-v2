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

export function getTimesheetFilename(employeeId: string, fromDate: string, toDate: string): string {
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB').replace(/\//g, '-')
  return `${employeeId}_Timesheet_${fmt(fromDate)}_to_${fmt(toDate)}.csv`
}
