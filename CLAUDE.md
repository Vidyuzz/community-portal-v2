# GSR Timesheet Portal

A timesheet and leave portal built **for GSR Group** by a four-person team. GSR is a
staffing business: its employees are placed with customer companies, log their time
here, and at month end their timesheet is emailed to a manager at the company they
are placed with, who approves or rejects it through one-time links.

> **"Client" means two different things in this project.** GSR is the customer we
> build for. A **client manager** is the external person at the company where a GSR
> employee is placed — the one who approves timesheets. Code and docs use
> "client" for the second sense (`client_name`, `client_manager_email`,
> `/api/client-approval`). Keep the distinction when writing anything new.

## Status — read this before planning work

The current stack is a **demo/pilot**. Decided direction:

- **Frontend carries forward** — React app is being kept, with a redesign not yet scoped.
- **Backend and database are being discarded.** A rewrite in **Express + TypeScript**,
  self-hosted, with its own Postgres, lands in a **new repo**. Supabase and Render are
  both being left behind.

So: don't invest in FastAPI internals. Domain rules, API shapes and the frontend are
the durable assets. `PARITY_CONTRACT.md` is the API spec the Express backend must
satisfy so the existing frontend keeps working unchanged.

## Who decides what

| Person | Role |
|---|---|
| Pugazhenthi | Senior dev — architecture and technical decisions |
| Ramya | Developer |
| Rajkumar | Manager |
| Benjamin | GSR stakeholder — owns HR, the client-side decision maker |

Product decisions come from Benjamin; technical ones from Pugazhenthi. Full history
and reasoning in `DECISIONS.md`.

## Layout

```
frontend/   React 19 + Vite + TypeScript + MUI + SCSS      → Vercel
backend/    FastAPI + SQLAlchemy 2 + Alembic               → Render (being replaced)
            Postgres on Supabase, ap-south-1               (being replaced)
```

The repo is named `community-portal-v2` and the API calls itself "Community Portal
API" — both legacy. The product is the **GSR Timesheet Portal**.

## Running and verifying

```bash
# backend
cd backend && alembic upgrade head && python -m scripts.seed   # seed WIPES all rows
uvicorn app.main:app --reload

# frontend
cd frontend && npm ci && npm run dev
npm run build      # tsc -b runs first — this is the typecheck, use it before committing
```

There is no test suite. Changes are verified by driving the real app with FastAPI's
`TestClient` against a throwaway SQLite database — assert status codes and the
resulting balances, not just that a call succeeds. Past sessions have kept these
scripts outside the repo; that is fine, but never claim something works without
having run it.

## Rules that are easy to get wrong

These are business rules, not preferences. Changing one silently changes what
employees are paid.

**Leave arithmetic**
- 1.25 days credited monthly. There is **no automation** — an admin clicks Bulk Leave
  Credit. The "credited on the 1st" wording is a description of intent, not a job.
- `Leave` costs 1.0 day, `HalfDay` costs 0.5. Working and Holiday cost nothing.
- The balance **floors at zero and must never go negative.** Leave taken with no
  balance left is loss of pay, settled by payroll outside the portal. A negative
  balance would eat into the next monthly credit and charge the employee twice for
  one day.
- Balances carry forward indefinitely. No lapse, no cap, no year-end reset.
- Known imprecision, accepted deliberately: deleting a leave entry taken while short
  on balance refunds the nominal day, which can return marginally more than came off.
  Tracking it exactly needed a per-entry column that was judged not worth it.

**Hours**
- The employee picks the day type; hours are then constrained to that type's band.
- `HalfDay` → 4–6 hours. `Working` → 6–12 hours. `Leave`/`Holiday` carry no hours.
- 6 is valid for both — the employee decides which. Nothing is auto-converted.

**One entry per day**
- GSR employees work a single project, so a day is one row. Duplicates are rejected
  with 409 on create, and when an edit moves an entry onto an occupied date.

**Locks**
- Month locks are global, not per employee. A locked month blocks all edits.
- Entries also lock 14 days after creation. This is hard-coded and nobody has
  confirmed it reflects real policy.

**Day types are `Working | Leave | Holiday | HalfDay`.** Comp-off was removed at
Benjamin's request; do not reintroduce it.

## Conventions

- **Work on `master`.** No feature branches — this was asked for explicitly.
- Do not commit `.npm_cache/`; it is not gitignored and `npm install` fills it with
  tens of MB of untracked files.
- `scripts/seed.py` deletes every row before seeding. Never run it against a database
  holding real data.

## Landmines

Things that look finished and are not:

- **There is no authentication.** Role comes from an unsigned `portal_role` cookie the
  browser controls; anyone can set it to `ADMIN` from the console and reach leave
  balances and bulk credit. Acceptable for a demo, never for a pilot. Microsoft SSO is
  the agreed replacement, blocked on GSR's IT.
- **The Documents page is entirely mock data.** Folders, files, versions and sizes are
  hard-coded; nothing uploads or downloads.
- **The internal approval flow was designed and never wired up.** Entries carry
  `status` and `manager_reason`, and a denial dialog exists in the frontend, but no
  route writes either field and nothing renders the dialog. Everything sits at
  `Pending` forever.
- **No scheduler exists anywhere.** Reminder emails only send when an admin clicks the
  button.
- **Email sends nothing unless Graph credentials are configured.** Endpoints return
  `email_sent: false` and the UI warns. Whether to switch to Resend is undecided.
- Only two roles exist, `EMPLOYEE` and `ADMIN`, and that is deliberate — Benjamin
  declined a manager role. Users carry a `managerId` that no permission logic reads.

## Infrastructure notes (current stack only)

- Supabase's pooler in **session mode (port 5432) allows 15 client connections for the
  whole project.** The engine pool is deliberately small (3 + 2 overflow, tunable via
  `DB_POOL_SIZE` / `DB_MAX_OVERFLOW`). It was previously 20 + 10, which let one
  instance take every slot, starved `alembic upgrade head`, and crash-looped deploys
  while Render kept serving the old build. Do not raise it without moving to the
  transaction pooler on 6543.
- Render's start command is `alembic upgrade head && uvicorn app.main:app --host
  0.0.0.0 --port $PORT`. There is no `render.yaml`.
- Render free spins down when idle; `.github/workflows/keep-warm.yml` pings `/health`
  every 10 minutes so demos do not open on a cold start. Delete it with Render.
- Frontend and backend deploy independently, so a new frontend can briefly meet an old
  backend. Tolerate that rather than assuming lockstep.

## See also

- `DECISIONS.md` — what was decided, by whom, when, and why; plus open questions.
- `PARITY_CONTRACT.md` — endpoint-by-endpoint API spec; the target for the Express rewrite.
