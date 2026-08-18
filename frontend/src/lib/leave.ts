import type { DayType } from '../types/timesheet'

/** Days credited to every employee on the 1st of each month. */
export const MONTHLY_LEAVE_CREDIT = 1.25

/**
 * Days debited from the leave balance per day type — mirrors LEAVE_COST in
 * backend/app/routers/timesheets.py. The balance floors at zero; days taken
 * beyond it are loss of pay and handled outside the portal.
 */
export const LEAVE_COST: Partial<Record<DayType, number>> = {
  Leave: 1,
  HalfDay: 0.5,
}

export const leaveCost = (type: DayType): number => LEAVE_COST[type] ?? 0

/** 1 -> '1', 1.25 -> '1.25' */
export const formatDays = (value: number): string =>
  Number(value.toFixed(2)).toString()
