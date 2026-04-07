from typing import List

from fastapi import Request, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Mock users for dev mode (matches existing seed data IDs)
MOCK_USERS = {
    "EMPLOYEE": "mock-user-raj-kumar",
    "ADMIN": "mock-user-admin",
}


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Get current user from portal_role cookie (dev mode)."""
    # Read role from cookie (same logic as lib/rbac.ts getCurrentRole)
    role = "EMPLOYEE"
    cookie_header = request.headers.get("cookie", "")
    for part in cookie_header.split(";"):
        part = part.strip()
        if part.startswith("portal_role="):
            val = part.split("=", 1)[1]
            if val in ("ADMIN", "EMPLOYEE"):
                role = val
            break

    user_id = MOCK_USERS.get(role, MOCK_USERS["EMPLOYEE"])
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        # Fallback: try the default mock user
        user = db.query(User).filter(User.id == "mock-user-raj-kumar").first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

    return user


def require_role(allowed_roles: List[str]):
    """Dependency factory that checks user role."""
    def _check(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return current_user
    return _check
