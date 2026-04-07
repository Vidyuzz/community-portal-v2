from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AdminStats(BaseModel):
    totalEmployees: int
    submissionsThisMonth: int
    lockedMonths: int
    pendingTimesheets: int


class ManagerInfo(BaseModel):
    name: str

    class Config:
        from_attributes = True


class AdminUserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    employeeId: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    managerId: Optional[str] = None
    leave_balance: float
    createdAt: datetime
    manager: Optional[ManagerInfo] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    designation: Optional[str] = None
    department: Optional[str] = None
    managerId: Optional[str] = None
    role: Optional[str] = None
    leave_balance: Optional[float] = None
    employeeId: Optional[str] = None


class MonthLockOut(BaseModel):
    id: int
    year: int
    month: int
    locked_by: str
    locked_at: datetime

    class Config:
        from_attributes = True


class MonthLockCreate(BaseModel):
    year: int
    month: int


class BulkCreditRequest(BaseModel):
    amount: float


class ReminderRequest(BaseModel):
    type: str
