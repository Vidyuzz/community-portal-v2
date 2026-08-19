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
| Vidyut | Developer |
| Rajkumar | Manager |
| Benjamin | GSR stakeholder — owns HR, the client-side decision maker |

Product decisions come from Benjamin; technical ones from Pugazhenthi. Full history
and reasoning in `DECISIONS.md`.

## Layout

```
frontend/   React 19 + Vite + TypeScript + MUI + SCSS      → Vercel
*.md        product rules, decisions, API contract
```

**This repo is frontend-only.** The backend lives in its own repo (Express +
TypeScript). The repo is named `community-portal-v2` and the API still calls itself
"Community Portal API" — both legacy. The product is the **GSR Timesheet Portal**.

## Running and verifying

```bash
cd frontend && npm ci && npm run dev
npm run build      # tsc -b runs first — this IS the typecheck, run it before committing
```

There is no test suite. `npm run build` is the only automated gate, so it catches type
errors and nothing else. Anything behavioural has to be exercised against a running
backend. Never claim something works without having run it.

The frontend reaches the API via `VITE_API_BASE_URL`, falling back to `/api`.
`frontend/vercel.json` rewrites `/api/*` to the deployed backend. Note that a relative
`fetch()` bypasses that base URL and arrives without the auth cookie — always go
through `src/api/client.ts`, which is why Submit to Client was silently broken.

## The backend

Removed from this repo when the rewrite began. Two things to know:

- **Reference implementation**: the full FastAPI backend is at commit **`203e180`**.
  Recover any of it with `git checkout 203e180 -- backend/`. Tags could not be pushed
  from the session that removed it, so the SHA is the handle.
- **`PARITY_CONTRACT.md` is the spec**, not the old Python. It documents every endpoint
  as actually implemented, and the Express backend must match it so this frontend keeps
  working untouched.

A FastAPI instance may still be serving the deployed frontend from an earlier build.
It cannot be rebuilt from this repo any more.

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
- Do not commit `.npm_cache/`; it is not gitignored, a handful of stale cache files are
  already tracked, and `npm install` fills it with tens of MB more.

## Landmines

Things that look finished and are not:

- **There is no authentication.** Role comes from an unsigned `portal_role` cookie the
  browser controls; anyone can set it to `ADMIN` from the console and reach leave
  balances and bulk credit. Acceptable for a demo, never for a pilot. Microsoft SSO is
  the agreed replacement, blocked on GSR's IT.
- **The Documents page is entirely mock data.** Folders, files, versions and sizes are
  hard-coded; nothing uploads or downloads.
- **The internal approval flow was designed and never wired up.** The schema carries
  `status` and `manager_reason`, and `DenyReasonModal.tsx` exists in the frontend but is
  rendered by nothing. Entries sit at `Pending` forever. Either finish it in the rewrite
  or drop the fields.
- **No scheduler existed.** Reminder emails only send when an admin clicks the button.
- **Email sends nothing unless mail credentials are configured.** The API returns
  `email_sent: false` and the UI warns on it. Whether to use MS Graph or Resend is
  undecided.
- Only two roles exist, `EMPLOYEE` and `ADMIN`, and that is deliberate — Benjamin
  declined a manager role. Users carry a `managerId` that no permission logic reads.

## Lessons from the old deployment

Worth carrying into the new one:

- **Connection limits are not theoretical.** Supabase's pooler in session mode allowed
  15 client connections for the entire project; the engine asked for up to 30 from one
  instance. It took every slot, starved the migration step on deploy, and crash-looped
  the service while the platform kept serving a stale build — which presented as a
  frontend calling endpoints that "did not exist". Size the pool against the ceiling,
  and make sure a failing deploy is loud rather than invisible.
- **A migration that does nothing is worse than no migration.** The initial migration
  was an empty stub for months; the schema only existed because someone had run a seed
  script by hand. Nobody noticed until a database had to be rebuilt.
- **Frontend and backend deploy independently**, so a new frontend can briefly meet an
  old backend. Tolerate the gap rather than assuming lockstep — `TracksheetPage`
  swallows a 404 from `/api/locks` for exactly this reason.
- `.github/workflows/keep-warm.yml` pings the old backend so free-tier demos do not
  open on a cold start. Delete it once that host is gone.

## See also

- `DECISIONS.md` — what was decided, by whom, when, and why; plus open questions.
- `PARITY_CONTRACT.md` — endpoint-by-endpoint API spec; the target for the Express rewrite.
