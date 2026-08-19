# Decisions

Product and technical decisions for the GSR Timesheet Portal, with the reasoning
behind them. `CLAUDE.md` states the rules; this file records where they came from and
what is still open.

**On sourcing.** Decisions below are drawn from Benjamin's review email, a recorded
client review on 17 Aug 2026, and internal team calls. The call records were
machine-transcribed — the client call in English, the internal call in Tamil and
translated. Wording is paraphrased and occasionally imperfect. Where a decision rests
on a passage that was unclear, it is marked **[confirm]**.

---

## Product decisions — Benjamin (GSR)

### Leave

| Decision | Source |
|---|---|
| Monthly credit is **1.25 days**, not 1.5 | Review email; confirmed live on the 17 Aug call |
| `Leave` deducts 1.0, `HalfDay` deducts 0.5 | 17 Aug |
| Balance **floors at zero**, never negative | 17 Aug, plus follow-up |
| Balances **carry forward**, no lapse or cap | Follow-up |
| Over-balance leave is **loss of pay, handled outside the portal** | Follow-up |
| **Leave approval stays out of the portal** — it is done over email today and should remain there | 17 Aug |

The zero floor matters more than it looks. Allowing a negative balance was proposed
and rejected: an employee at −1 would receive 0.25 the following month instead of
1.25, charging them twice for a day already lost to unpaid leave.

### Timesheet entry

| Decision | Source |
|---|---|
| **Comp-off removed entirely** — stated three times, "won't be that helpful" | 17 Aug |
| `HalfDay` must be **4–6 hours**; a full working day **6–12** | 17 Aug, refined in follow-up |
| Employees work **one project**, so one entry per day is correct | Follow-up |
| No restriction on a normal day beyond the band — 7 or 10 hours are both fine | 17 Aug |
| Submission cadence is **monthly** | 17 Aug |
| Month locks are **global**, not per employee | 17 Aug |

The hours rule was initially misread as auto-derivation (under 4 hours becomes leave,
4–6 becomes half-day). It is not. The employee picks the type and the hours field is
constrained to that type's band. Nothing converts automatically.

### Sending to the client manager

| Decision | Source |
|---|---|
| Rejections must carry a **reason**, so the employee knows why | 17 Aug, asked twice |
| Attachment is **.xlsx**, not CSV | Follow-up |

### People and access

| Decision | Source |
|---|---|
| **Two roles only** — admin and employee. A manager role was offered and declined: "let's not complicate it" | 17 Aug |
| **Microsoft SSO**, no portal-managed passwords; two-factor delegated to Microsoft | 17 Aug + internal |
| Benjamin is **sole admin** and handles onboarding/offboarding directly — no separate team to route through | 17 Aug |
| Leavers are **disabled and retained**, not deleted; history must survive | 17 Aug |
| Employees are **bulk-uploaded from Excel** by HR | Internal |

Self-enrollment with personal-email verification was proposed internally and is now
**dead**: Benjamin chose Microsoft SSO, and the roster is pre-loaded by HR. Someone
who is not already in the system cannot log in at all.

### Admin panel

| Decision | Source |
|---|---|
| Leave panel needs **filters** and the ability to credit a subset, not everyone | 17 Aug |
| **Excel upload** for leave balances and for employees | 17 Aug + follow-up |
| Per-employee **private documents** (e.g. insurance cards) — flagged optional | 17 Aug |

### Removed at Benjamin's request

Team Directory (page, route, nav, and the backing API) and the Document Library's
"Total Versions" tile.

---

## Technical decisions — Pugazhenthi

### Platform

The FastAPI backend and Supabase database are being **replaced by Express +
TypeScript, self-hosted, with its own Postgres, in a new repo**. The React frontend
carries over. A redesign of the frontend is expected but has not been scoped.

Express project structure, as walked through internally:

```
src/
  server.ts        boots the process
  app.ts           the Express app
  routes/          one file per module (user.ts, leave.ts), index.ts aggregates
  controllers/     called by routes
  services/        business logic and DB access
  lib/             reusable helpers
  config/
    database.ts    connection, exported once
    env.ts         reads process.env in exactly one place, exports typed config
```

- Routes are versioned: `/v1/user`.
- **No `models/` folder** — explicitly dropped, since the ORM covers DB access.
- `.env` per environment, read only through `config/env.ts`, so code refers to
  `config.databaseUrl` rather than `process.env` scattered everywhere.
- **ORM is not yet chosen.** ORMs were discussed generically; no product was named.

### Data model changes for the rewrite

**Departments become a table.** Today `department` is nullable free text on the user.
It becomes a table with IDs, managed dynamically from the admin dashboard, with the
employee record carrying a `department_id`. Uploads supply the department *name* and
the backend resolves it to an ID.

**Employee upload columns:** name, personal mail ID, department, mobile. Personal mail
ID and department are mandatory; the rest can be filled in later.

### Authentication flow

Login button → redirect to Microsoft → user signs in with the company account →
redirect back with a temporary token → the **server** exchanges and verifies it with
the identity provider → reads the email → matches an existing user record.

Verification is server-side; nothing the browser asserts is trusted. Two-factor is
Microsoft's responsibility, not the portal's. An app registration is required on
GSR's side, which is why this is blocked on their IT.

---

## Open questions

**Which email does login match on?** Employee uploads capture a *personal* mail ID,
but Microsoft returns the *company* address. Matching one against the other means
nobody signs in. `User.email` is currently a single unique column; the rewrite
probably needs both — one for contact, one for identity. Raised internally,
unresolved.

**What happens when a department is deleted?** Employees pointing at a dead ID need a
rule: block deletion while it is in use, or null the reference. Raised internally,
unresolved.

**Email provider.** Microsoft Graph needs an Azure app registration with admin
consent — the same IT dependency as SSO. Resend was considered as a faster
alternative and is undecided pending a call with Rajkumar. Note Resend requires domain
verification before it can send to arbitrary recipients.

**Is the 14-day entry lock real policy?** It is hard-coded and has never been
confirmed with Benjamin.

**Does an internal manager approve before the client sees a timesheet?** The database
has the fields and nothing writes them. Benjamin said the focus is "majorly the
internal community" **[confirm]**, but no approval flow was specified. Either build it
or drop the columns.

**Frontend redesign scope** — restyling existing components or rebuilding screens. If
screens are rebuilt from scratch, the rules in `CLAUDE.md` must be re-implemented
deliberately; they will not carry themselves across.

---

## Built vs not built

**Done and deployed:** 1.25 credit · leave deduction with the zero floor · hours bands
· one entry per day · comp-off removal · rejection reasons · leave-panel and user-panel
filters · subset crediting · xlsx attachment · Submit to Client fix and employee
confirmation mail · Team Directory and Total Versions removal · query-cascade and
employee-403 fixes · connection-pool sizing · keep-warm ping.

**Agreed, not built:** Excel upload for leave balances · Excel upload for employees ·
soft-disable employees · per-employee private documents · Microsoft SSO.

Everything in the second list is intended for the Express rewrite rather than the
current backend, except where a demo needs it sooner.
