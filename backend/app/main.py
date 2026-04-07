from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.routers import (
    timesheets,
    notifications,
    team,
    leave_balance,
    client_approval,
    reminders,
    admin,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Import models for mapper configuration (schema via Alembic: `alembic upgrade head`)
    import app.models  # noqa: F401
    yield


app = FastAPI(title="Community Portal API", lifespan=lifespan)


def _error_payload(detail) -> str:
    if isinstance(detail, str):
        return detail
    if isinstance(detail, list) and detail:
        # Pydantic validation errors
        first = detail[0]
        if isinstance(first, dict) and "msg" in first:
            return str(first["msg"])
    return str(detail)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_request: Request, exc: StarletteHTTPException):
    """Match Next.js API: JSON body `{ \"error\": \"...\" }` instead of FastAPI `detail`."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": _error_payload(exc.detail)},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"error": _error_payload(exc.errors())},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(timesheets.router)
app.include_router(notifications.router)
app.include_router(team.router)
app.include_router(leave_balance.router)
app.include_router(client_approval.router)
app.include_router(reminders.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    return {"status": "ok"}
