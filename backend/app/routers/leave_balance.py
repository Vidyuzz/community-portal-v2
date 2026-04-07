"""
Leave balance route — direct port of app/api/leave-balance/route.ts
"""
from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/api/leave-balance")
def get_leave_balance(current_user: User = Depends(get_current_user)):
    try:
        return {"balance": current_user.leave_balance or 0}
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")
