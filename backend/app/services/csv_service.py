"""
CSV generation — direct port of lib/csv.ts.
"""
from datetime import datetime
from typing import Optional


def _escape_csv(value: Optional[str]) -> str:
    if value is None:
        return '""'
    escaped = str(value).replace('"', '""')
    return f'"{escaped}"'


def generate_timesheet_csv(
    entries: list,
    employee_name: str,
    employee_id: str,
    manager_name: str,
) -> str:
    header = "Date,Day,Employee ID,Employee Name,Reporting Manager Name,Client Name,Project Name,Day Type,Hours,Comments"
    rows = [header]

    for entry in entries:
        work_date = entry.work_date if isinstance(entry.work_date, datetime) else datetime.fromisoformat(str(entry.work_date))
        date_str = work_date.strftime("%d/%m/%Y")
        day_str = work_date.strftime("%A")

        row = ",".join([
            _escape_csv(date_str),
            _escape_csv(day_str),
            _escape_csv(employee_id),
            _escape_csv(employee_name),
            _escape_csv(manager_name),
            _escape_csv(entry.client_name),
            _escape_csv(entry.project_name),
            _escape_csv(entry.type_of_day),
            _escape_csv(str(entry.hours_worked) if entry.hours_worked is not None else ""),
            _escape_csv(entry.comments),
        ])
        rows.append(row)

    return "\r\n".join(rows) + "\r\n"


def get_timesheet_filename(employee_id: str, from_date: str, to_date: str) -> str:
    def fmt(d: str) -> str:
        dt = datetime.fromisoformat(d.replace("Z", "+00:00")) if "T" in d else datetime.strptime(d, "%Y-%m-%d")
        return dt.strftime("%d-%m-%Y")

    return f"{employee_id}_Timesheet_{fmt(from_date)}_to_{fmt(to_date)}.csv"
