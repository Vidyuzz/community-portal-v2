# Deployment

## Architecture
- **Frontend:** React SPA on Vercel (`community-portal-v2.vercel.app`). `frontend/vercel.json`
  rewrites `/api/*` to the backend on Render.
- **Backend:** FastAPI on Render (`community-portal-v2.onrender.com`), rooted at `backend/`.
- **Database:** PostgreSQL on Render.
- **Auth (demo):** dev-mode only — a `portal_role` cookie maps to mock users
  (`mock-user-raj-kumar`, `mock-user-admin`) in `app/dependencies.py`. There is no real Azure
  AD sign-in yet, so `DEV_MODE=true` must stay set.

## What broke, and what changed
The portal rendered but showed empty Team / Timesheet pages because the backend was returning
HTTP 500 on every DB call (the SPA fakes "logged in" from a cookie, so pages load regardless).
Two latent problems made the database unreliable:

1. **The initial Alembic migration was an empty stub**, so `alembic upgrade head` created zero
   tables — the schema only ever existed because someone ran the seed by hand. Fixed:
   `backend/alembic/versions/131f6e5f7c46_initial_schema.py` now builds the full schema from
   the models (idempotent).
2. **`DATABASE_URL` could silently fall back to ephemeral SQLite** (wiped on every redeploy).
   Fixed: with `ENVIRONMENT=production`, the app now refuses to start on SQLite
   (`app/config.py`), so misconfiguration fails loudly instead of showing an empty portal.

Deploys now run migrations + an idempotent seed automatically (see below), so a fresh database
comes up populated and the schema always matches the models.

## Deploy option A — Blueprint (recommended)
Render Dashboard → **Blueprints** → **New Blueprint Instance** → point at this repo. `render.yaml`
provisions the web service **and** a Postgres database, wires `DATABASE_URL` from it, and uses
this start sequence:

```
alembic upgrade head && python -m scripts.bootstrap && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

- `alembic upgrade head` — builds/updates the schema.
- `scripts.bootstrap` — seeds the demo dataset **only if the DB is empty** (safe on every
  restart; never wipes data entered during the demo). To force a clean reseed:
  `python -m scripts.seed`.

## Deploy option B — keep the existing manually-created service
Set these in the service's **Settings** (Render dashboard):
- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `alembic upgrade head && python -m scripts.bootstrap && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment variables:**
  - `DATABASE_URL` → your Postgres connection string (Render's Internal URL). `postgres://`
    and `postgresql://` are both normalized automatically.
  - `ENVIRONMENT=production`
  - `DEV_MODE=true`
  - `FRONTEND_URL=https://community-portal-v2.vercel.app`

If the previous free Postgres was auto-deleted (Render deletes free databases 90 days after
creation), create a new Postgres instance and point `DATABASE_URL` at it.

## Verify after deploy
```
curl https://community-portal-v2.onrender.com/health
# {"status":"ok"}   (note: passes even with a dead DB — necessary, not sufficient)

curl -H "Cookie: portal_role=EMPLOYEE" https://community-portal-v2.onrender.com/api/team
# JSON array of users (NOT a 500)

curl -H "Cookie: portal_role=EMPLOYEE" https://community-portal-v2.onrender.com/api/timesheets
# JSON array including the seeded dummy entries
```
Then in the browser: log in via the **emp** button → Timesheet shows dummy rows (the Eye icon
opens one), Team lists members, Leave Balance shows a number.

## Durability note
Render's **free** Postgres is deleted 90 days after creation. For anything beyond a short-lived
demo, move to a paid Render Postgres or a non-expiring managed provider (Neon / Supabase) and
update `DATABASE_URL`.

## Local development
```
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python -m scripts.seed            # SQLite (default) + demo data
uvicorn app.main:app --reload
```
`ENVIRONMENT` defaults to `development`, so the local SQLite default is allowed.
