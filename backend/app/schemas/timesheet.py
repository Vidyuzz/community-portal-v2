from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel


class TimesheetUserInfo(BaseModel):
    name: str
    email: str


class TimesheetOut(BaseModel):
    timesheet_id: int
    user_id: str
    client_name: Optional[str] = None
    project_name: Optional[str] = None
    work_date: datetime
    type_of_day: str
    hours_worked: Optional[float] = None
    comments: Optional[str] = None
    status: str
    manager_reason: Optional[str] = None
    updated_at: datetime
    user: Optional[TimesheetUserInfo] = None

    class Config:
        from_attributes = True


class TimesheetCreate(BaseModel):
    client_name: Optional[str] = None
    project_name: Optional[str] = None
    work_date: str
    type_of_day: str = "Working"
    hours_worked: Optional[float] = None
    comments: Optional[str] = None


class ManagerGroupedResponse(BaseModel):
    user_id: str
    full_name: str
    email: str
    entries: List[TimesheetOut]


class ClientSubmissionOut(BaseModel):
    id: int
    user_id: str
    client_name: str
    client_manager_name: str
    client_manager_email: str
    from_date: datetime
    to_date: datetime
    submitted_at: datetime
    approval_token: str
    cs_status: str
    responded_at: Optional[datetime] = None
    rejection_note: Optional[str] = None
    user: Optional[TimesheetUserInfo] = None

    class Config:
        from_attributes = True


class ClientSubmissionPayload(BaseModel):
    client_name: str
    client_manager_name: str
    client_manager_email: str
    from_date: str
    to_date: str
    csv_content: str
