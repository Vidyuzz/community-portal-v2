from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TeamUserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    employeeId: str
    designation: str
    department: str
    managerId: Optional[str] = None
    createdAt: datetime
    currentClient: Optional[str] = None
    timesheetCount: int

    class Config:
        from_attributes = True
