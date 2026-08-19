# API Contract — GSR Timesheet Portal
> Originally written 2026-04-01 to port Next.js 16 + Prisma → React + FastAPI + PostgreSQL.
> Revised 2026-08-18: this now describes **the API as currently implemented**, and is the
> specification the **Express + TypeScript rewrite must satisfy** so the existing React
> frontend keeps working without changes.
>
> The FastAPI implementation this describes was removed from the repo once the rewrite
> began; it remains in history at commit `203e180` (`git checkout 203e180 -- backend/`)
> if you need to check behaviour this document does not capture.
>
> Product rules live in `CLAUDE.md`; the reasoning behind them in `DECISIONS.md`.
> Where the two disagree with this file, this file is wrong — say so and fix it.
>
> **Not implemented despite appearing below in earlier revisions:** there is no manager
> approval route. `Timesheet.status` and `manager_reason` exist in the schema, are never
> written by any endpoint, and every entry stays `Pending`.

---

## 1. Frontend Routes (15 pages)

| Route | Auth Required | Role Guard | Notes |
|-------|-------------|-----------|-------|
| `/` | No | — | Redirects to `/login` if unauthenticated, `/portal/home` if authenticated |
| `/login` | No | — | Azure AD sign-in trigger |
| `/portal/home` | Yes | Any | Dashboard widgets |
| `/portal/dashboard` | Yes | Any | Charts/stats |
| `/portal/profile` | Yes | Any | Current user profile |
| `/portal/documents` | Yes | Any | Document links |
| `/portal/tracksheet` | Yes | Any | Employee timesheet CRUD |
| `/portal/careers` | Yes | Any | Job listings |
| `/portal/careers/referral` | Yes | Any | Referral form |
| `/portal/onboard` | Yes | Any | Onboarding info |
| `/portal/master` | Yes | ADMIN only | Admin panel |
| `/client-approval/already-responded` | No | — | Static page, no auth |
| `/client-approval/confirmed` | No | — | Reads `?action=&client=` query params |
| `/client-approval/invalid` | No | — | Static page, no auth |
| `/client-approval/reject` | No | — | Collects a rejection reason, then calls the API with `note` |

---

## 2. API Endpoints (18 total)

### 2.1 Timesheets

#### `GET /api/timesheets`
- **Auth**: Required
- **Query params**:
  - `status` → `Pending | Approved | Denied` (optional filter)
  - `from` → `YYYY-MM-DD` (optional, filters `work_date >= from`)
  - `to` → `YYYY-MM-DD` (optional, filters `work_date <= to`)
  - `role=manager` → triggers manager grouped view
- **Response 200** (employee view — flat array):
```json
[
  {
    "timesheet_id": 1,
    "user_id": "string",
    "client_name": "string | null",
    "project_name": "string | null",
    "work_date": "2026-03-01T00:00:00.000Z",
    "type_of_day": "Working",
    "hours_worked": 8.0,
    "comments": "string | null",
    "status": "Pending",
    "manager_reason": "string | null",
    "updated_at": "2026-03-01T00:00:00.000Z"
  }
]
```
- **Response 200** (`?role=manager` — grouped array):
```json
[
  {
    "user_id": "string",
    "full_name": "string",
    "email": "string",
    "entries": [ /* same TimesheetEntry shape, includes user: {name, email} */ ]
  }
]
```
- **Response 500**: `{"error": "Internal server error"}`

#### `POST /api/timesheets`
- **Auth**: Required
- **Body**:
```json
{
  "client_name": "string (optional)",
  "project_name": "string (optional)",
  "work_date": "2026-03-01",
  "type_of_day": "Working",
  "hours_worked": 8.0,
  "comments": "string (optional)"
}
```
- **Validation, in this order:**
  1. `work_date` required.
  2. **Duplicate date** — an entry already on that calendar day for this user → 409.
  3. **Hours band** — `HalfDay` must be 4–6, `Working` 6–12. `Leave`/`Holiday` carry no
     hours. Hours are required whenever the type has a band.
  4. **Leave debit** — `Leave` costs 1.0 day, `HalfDay` 0.5, applied to the caller's
     `leave_balance` **floored at zero**, in the same transaction as the insert. Never
     blocks, never goes negative. See `CLAUDE.md`.
- **Response 201**: Full `TimesheetEntry` object (status defaults to `Pending`)
- **Response 400**: `{"error": "work_date is required"}` |
  `{"error": "Hours are required for a Working entry."}` |
  `{"error": "A half-day entry must be between 4 and 6 hours."}`
- **Response 409**: `{"error": "An entry for 17 Aug 2026 already exists. Edit the existing entry instead."}`
- **Response 500**: `{"error": "Internal server error"}`

#### `PATCH /api/timesheets/{id}`
- **Auth**: Required
- Editable fields: `client_name`, `project_name`, `work_date`, `type_of_day`, `hours_worked`, `comments`
- **Ownership**: non-admins may only touch their own entries; a foreign entry returns
  **404**, not 403, so existence is not leaked. Admins may edit any entry, and the leave
  balance always moves on the entry's **owner**, never on the editor.
- Rejected if the entry is older than 14 days, or its month is locked.
- **Validated against the entry as it will look after the patch**, not only the fields
  sent — switching type alone can put existing hours out of band.
- **Moving to an occupied date** → 409.
- **Leave balance settles the difference only**: Working→Leave debits 1.0,
  Leave→Working refunds it, Leave→HalfDay refunds 0.5. Floored at zero.
- Response 200: Updated `TimesheetEntry`
- Response 400: hours-band or missing-hours message
- Response 403: `{"error": "Entry is locked after 2 weeks and cannot be edited."}` |
  `{"error": "This month has been locked by an admin and cannot be modified."}`
- Response 404: `{"error": "Entry not found"}` (missing, or not yours)
- Response 400: `{"error": "Invalid id"}` (if `id` is not a valid integer)
- Response 409: `{"error": "An entry for 17 Aug 2026 already exists."}`
- Response 500: `{"error": "Internal server error"}`

#### `DELETE /api/timesheets/{id}`
- **Auth**: Required
- Same ownership rule as PATCH — a foreign entry returns 404.
- Rejected if older than 14 days, or its month is locked.
- **Refunds** the entry's leave cost to its owner.
- **Response 200**: `{"success": true}`
- **Response 400**: `{"error": "Invalid id"}`
- **Response 403**: `{"error": "This month has been locked by an admin and cannot be modified."}`
- **Response 404**: `{"error": "Entry not found"}`
- **Response 500**: `{"error": "Internal server error"}`

#### `GET /api/timesheets/submissions`
- **Auth**: Required
- **Query params**: `all=1` → returns all users' submissions (ADMIN only)
- Without `all=1`: returns current user's submissions only
- **Response 200**: Array of `ClientSubmission` objects (includes `user: {name, email}`)
```json
[
  {
    "id": 1,
    "user_id": "string",
    "client_name": "string",
    "client_manager_name": "string",
    "client_manager_email": "string",
    "from_date": "2026-03-01T00:00:00.000Z",
    "to_date": "2026-03-31T00:00:00.000Z",
    "submitted_at": "2026-04-01T00:00:00.000Z",
    "approval_token": "string",
    "cs_status": "Pending",
    "responded_at": null,
    "rejection_note": null,
    "user": {"name": "string", "email": "string"}
  }
]
```
- **Response 403**: `{"error": "Forbidden"}` (if `all=1` and not ADMIN)

#### `POST /api/timesheets/submit-client`
- **Auth**: Required
- **Body**:
```json
{
  "client_name": "string",
  "client_manager_name": "string",
  "client_manager_email": "user@example.com",
  "from_date": "2026-03-01",
  "to_date": "2026-03-31",
  "csv_content": "base64-encoded .xlsx (field name is historical)"
}
```
- `csv_content` is an **.xlsx workbook, base64-encoded by the frontend**. It is binary
  and is passed through to the mail attachment untouched — do not decode it as text.
  Unreadable base64 → 400.
- Side effects, both fire-and-forget: the timesheet to the client manager with
  approve/reject links, and a **confirmation copy to the submitting employee**.
- **Response 201**: `{"success": true, "submissionId": 1, "email_sent": true|false}`
  — `email_sent` is false when mail credentials are absent, so the UI can warn rather
  than report a success nobody receives.
- **Response 400**: `{"error": "All fields are required"}` | `{"error": "Invalid client manager email"}`
- **Response 500**: `{"error": "Internal server error"}`

---

### 2.2 Team — removed

`GET /api/team` and the Team Directory page were removed at the client's
request. The route, its schema and the frontend page are gone; user listing
for admins remains at `GET /api/admin/users`.

---

### 2.3 Leave Balance

#### `GET /api/leave-balance`
- **Auth**: Required
- **Response 200**: `{"balance": 0.0}` — the caller's own balance. Floors at zero;
  see the leave rules in `CLAUDE.md`.
- **Response 500**: `{"error": "Internal server error"}`

#### `GET /api/locks`
- **Auth**: Required (**any role** — this is the point of it)
- Read-only month locks for the timesheet calendar, which greys out locked months for
  everyone. Admin CRUD stays on `/api/admin/locks`, which is ADMIN-only; the employee
  page used to call that and got a 403 on every load.
- **Response 200**: `[{"year": 2026, "month": 8}]`

---

### 2.4 Notifications

#### `GET /api/notifications`
- **Auth**: Required
- **Response 200**:
```json
{
  "notifications": [
    {
      "id": 1,
      "user_id": "string",
      "title": "string",
      "message": "string",
      "type": "approval | denial | reminder | lock | client_approved | client_rejected",
      "is_read": false,
      "created_at": "2026-04-01T00:00:00.000Z"
    }
  ],
  "unread": 3
}
```
- Max 30 notifications, ordered by `created_at` DESC
- `unread` = count of `is_read: false` in the returned 30

#### `POST /api/notifications/read`
- **Auth**: Required
- **Body**: `{"ids": [1, 2, 3]}` — marks specific notifications as read
- **Body**: `{}` or `{"ids": []}` — marks ALL user notifications as read
- **Response 200**: `{"success": true}`

---

### 2.5 Client Approval (Public — No Auth)

#### `GET /api/client-approval`
- **Auth**: None (public link sent via email)
- **Query params**: `token`, `action` (`approve` | `reject`), `note` (optional, for rejection)
- **Logic**:
  1. If `!token || !action || action not in ['approve','reject']` → redirect to `{FRONTEND_URL}/client-approval/invalid`
  2. If submission not found by token → redirect to `{FRONTEND_URL}/client-approval/invalid`
  3. If `submission.cs_status != 'Pending'` → redirect to `{FRONTEND_URL}/client-approval/already-responded`
  4. Update `cs_status` to `Approved` or `Rejected`, set `responded_at`, set `rejection_note`
  5. Create `Notification` for employee (type: `client_approved` or `client_rejected`)
  6. Redirect to `{FRONTEND_URL}/client-approval/confirmed?action={action}&client={encodeURIComponent(client_name)}`
- **Response**: `302 Redirect` (all paths)
- **Note**: `FRONTEND_URL` env var replaces `NEXTAUTH_URL` from the original

---

### 2.6 Reminders

#### `POST /api/reminders/send`
- **Auth**: Required, ADMIN only
- **Body**: `{"type": "weekly" | "monthly"}`
- **weekly logic**: Find users who have NOT submitted any timesheet this week (`work_date >= weekStart`); send reminder only to those. Skip users who already submitted.
- **monthly logic**: Send to ALL users.
- **Response 200**: `{"sent": N, "skipped": N}`
- **Response 403**: `{"error": "Forbidden"}`
- **Response 500**: `{"error": "Internal server error"}`

---

### 2.7 Admin

#### `GET /api/admin/stats`
- **Auth**: Required, ADMIN only
- **Response 200**:
```json
{
  "totalEmployees": 10,
  "submissionsThisMonth": 5,
  "lockedMonths": 2,
  "pendingTimesheets": 8
}
```
- `submissionsThisMonth`: count of `ClientSubmission` where `submitted_at` within current month
- `lockedMonths`: total count of `MonthLock` records
- `pendingTimesheets`: count of `Timesheet` where `status = 'Pending'`
- **Response 403**: `{"error": "Forbidden"}`

#### `GET /api/admin/users`
- **Auth**: Required, ADMIN only
- **Response 200**: Array of user objects
```json
[
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": "EMPLOYEE",
    "employeeId": null,
    "designation": null,
    "department": null,
    "managerId": null,
    "leave_balance": 0.0,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "manager": {"name": "string"} | null
  }
]
```
- Ordered by `name` ASC
- `manager` is the nested manager object (name only), or `null` if no manager

#### `PATCH /api/admin/users/{id}`
- **Auth**: Required, ADMIN only
- **Body** (all fields optional, whitelisted):
```json
{
  "designation": "string",
  "department": "string",
  "managerId": "string | null",
  "role": "EMPLOYEE | ADMIN",
  "leave_balance": 0.0,
  "employeeId": "string"
}
```
- Only whitelisted fields are updated; other fields ignored
- **Response 200**: Full updated `User` object (all fields from Prisma)
- **Response 403**: `{"error": "Forbidden"}`

#### `GET /api/admin/locks`
- **Auth**: Required (any role)
- **Response 200**: Array of `MonthLock` objects, ordered by year DESC, month DESC
```json
[
  {
    "id": 1,
    "year": 2026,
    "month": 3,
    "locked_by": "string",
    "locked_at": "2026-03-01T00:00:00.000Z"
  }
]
```

#### `POST /api/admin/locks`
- **Auth**: Required, ADMIN only
- **Body**: `{"year": 2026, "month": 3}`
- **Response 201**: Created `MonthLock` object
- **Response 400**: `{"error": "Valid year and month (1-12) are required"}`
- **Response 403**: `{"error": "Forbidden"}`
- **Response 409**: `{"error": "This month is already locked"}`

#### `DELETE /api/admin/locks/{id}`
- **Auth**: Required, ADMIN only
- **Response 200**: `{"success": true}`
- **Response 400**: `{"error": "Invalid id"}`
- **Response 403**: `{"error": "Forbidden"}`
- **Response 404**: `{"error": "Lock not found"}`

#### `POST /api/admin/leave/bulk-credit`
- **Auth**: Required, ADMIN only
- **Body**: `{"amount": 1.25, "user_ids": ["id", ...]}` — `user_ids` optional
- **Logic**: Adds `amount` to `leave_balance`. With `user_ids`, only those employees;
  omitted or empty means everyone, which is what the monthly run uses.
- **Response 200**: `{"updated": N, "amount": 1.25}`
- **Response 400**: `{"error": "Invalid amount"}` | `{"error": "user_ids must be a list"}`
- **Response 404**: `{"error": "No matching employees"}` (ids given, none matched)
- **Response 403**: `{"error": "Forbidden"}`

---

## 3. Authentication Contract

### Session Claims (JWT payload sent to frontend)
```typescript
{
  azureOid: string         // Azure AD Object ID (oid claim)
  userId: string           // DB primary key (cuid)
  role: "EMPLOYEE" | "ADMIN"
  managerId: string | null
  name: string
  email: string
  image: string | null
  accessToken: string      // Azure AD access token
}
```

### User Upsert Logic
On every valid Azure AD token:
1. Extract `oid`, `name`, `email` from JWT claims
2. `UPSERT users WHERE azure_oid = oid`:
   - **Create**: set `azure_oid`, `email`, `name`, `role = 'EMPLOYEE'`
   - **Update**: set `name`, `email` (do NOT overwrite role/managerId)
3. Return user with current `id`, `role`, `managerId`

### RBAC
- `EMPLOYEE`: own timesheets CRUD, notifications, leave-balance, month locks (read)
- `ADMIN`: all of the above plus the admin panel endpoints, and may edit any employee's
  timesheet entry
- **There is no MANAGER role and this is deliberate** — offered to GSR and declined
  ("let's not complicate it"). Users still carry a `managerId`, which no permission
  logic reads.

> **The current implementation has no authentication at all.** Role is read from an
> unsigned `portal_role` cookie and mapped to two hardcoded mock accounts, so any
> visitor can become ADMIN from the browser console. This is demo scaffolding and must
> not survive into the rewrite — see the Microsoft SSO flow in `DECISIONS.md`.

---

## 4. Database Schema (Source of Truth: prisma/schema.prisma)

### Enums
```
UserRole:        EMPLOYEE, ADMIN          # MANAGER never existed; a manager role was declined
DayType:         Working, Leave, Holiday, HalfDay   # CompOff removed Aug 2026
ApprovalStatus:  Pending, Approved, Denied
AnniversaryType: BIRTHDAY, WORK_ANNIVERSARY
```

### Tables

**users**
| Column | Type | Constraints |
|--------|------|------------|
| id | text (cuid) | PK |
| azure_oid | text | UNIQUE NOT NULL |
| email | text | UNIQUE NOT NULL |
| name | text | NOT NULL |
| role | UserRole | DEFAULT EMPLOYEE |
| manager_id | text | FK → users.id, NULLABLE |
| leave_balance | float | DEFAULT 0 |
| employee_id | text | NULLABLE |
| designation | text | NULLABLE |
| department | text | NULLABLE |
| created_at | timestamp | DEFAULT now() |
| updated_at | timestamp | auto-update |

**timesheets**
| Column | Type | Constraints |
|--------|------|------------|
| timesheet_id | int | PK AUTOINCREMENT |
| user_id | text | FK → users.id NOT NULL |
| client_name | text | NULLABLE |
| project_name | text | NULLABLE |
| work_date | timestamp | NOT NULL |
| type_of_day | DayType | DEFAULT Working |
| hours_worked | float | NULLABLE |
| comments | text | NULLABLE |
| status | ApprovalStatus | DEFAULT Pending |
| manager_reason | text | NULLABLE |
| updated_at | timestamp | auto-update |

**client_submissions**
| Column | Type | Constraints |
|--------|------|------------|
| id | int | PK AUTOINCREMENT |
| user_id | text | FK → users.id NOT NULL |
| client_name | text | NOT NULL |
| client_manager_name | text | NOT NULL |
| client_manager_email | text | NOT NULL |
| from_date | timestamp | NOT NULL |
| to_date | timestamp | NOT NULL |
| submitted_at | timestamp | DEFAULT now() |
| approval_token | text (cuid) | UNIQUE NOT NULL |
| cs_status | text | DEFAULT 'Pending' |
| responded_at | timestamp | NULLABLE |
| rejection_note | text | NULLABLE |

**notifications**
| Column | Type | Constraints |
|--------|------|------------|
| id | int | PK AUTOINCREMENT |
| user_id | text | FK → users.id NOT NULL |
| title | text | NOT NULL |
| message | text | NOT NULL |
| type | text | NOT NULL |
| is_read | boolean | DEFAULT false |
| created_at | timestamp | DEFAULT now() |

**month_locks**
| Column | Type | Constraints |
|--------|------|------------|
| id | int | PK AUTOINCREMENT |
| year | int | NOT NULL |
| month | int | NOT NULL |
| locked_by | text | NOT NULL |
| locked_at | timestamp | DEFAULT now() |
| — | — | UNIQUE(year, month) |

**holidays**
| Column | Type | Constraints |
|--------|------|------------|
| id | text (cuid) | PK |
| name | text | NOT NULL |
| date | timestamp | NOT NULL |
| type | text | NOT NULL |

**new_hires**
| Column | Type | Constraints |
|--------|------|------------|
| id | text (cuid) | PK |
| name | text | NOT NULL |
| department | text | NOT NULL |
| joined_at | timestamp | NOT NULL |
| avatar_url | text | NULLABLE |

**anniversaries**
| Column | Type | Constraints |
|--------|------|------------|
| id | text (cuid) | PK |
| name | text | NOT NULL |
| type | AnniversaryType | NOT NULL |
| date | timestamp | NOT NULL |

---

## 5. Email Service Contract (MS Graph)

### `sendStatusEmail(params)`
- **Trigger**: none — no route approves or denies a timesheet. Function is unused.
- **To**: Employee email
- **Subject**: `"Timesheet Approved — {workDate}"` or `"Timesheet Denied — {workDate}"`
- **Body**: HTML with project label (`{clientName} / {projectName}` or `N/A`), color-coded status

### `sendTimesheetToClient(params)`
- **Trigger**: POST /api/timesheets/submit-client
- **To**: Client manager email
- **Subject**: `"GSR Timesheet — {employeeName} — {fromDate} to {toDate}"`
- **Body**: HTML with two buttons. **Approve** links straight to
  `{BACKEND_URL}/api/client-approval?token=...&action=approve`. **Reject** links to
  `{FRONTEND_URL}/client-approval/reject?token=...`, a page that collects a reason and
  then calls the same endpoint with `note` — GSR asked for clarity on rejections.
- **Attachment**: `.xlsx` workbook, content type
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

### `sendSubmissionConfirmation(params)`
- **Trigger**: POST /api/timesheets/submit-client
- **To**: The submitting employee, so a submission is acknowledged rather than silent
- **Subject**: `"Timesheet sent to {clientName} — {fromDate} to {toDate}"`

### `sendReminderEmail(params)`
- **Trigger**: POST /api/reminders/send
- **To**: Employee email
- **Subjects**:
  - weekly: `"GSR Portal — Please submit your timesheet for this week"`
  - monthly: `"GSR Portal — Month-end reminder: Submit your timesheet to your client"`

### No-op behavior
All functions silently no-op (warning logged) if `GRAPH_SENDER_EMAIL` or
`AZURE_AD_CLIENT_ID` is unset. `email_configured()` exposes this so routes can report
`email_sent: false` instead of implying mail went out. Whether to replace MS Graph with
Resend is undecided — see `DECISIONS.md`.

---

## 6. CSV Generation Contract

**Columns (in order)**: Date, Day, Employee ID, Employee Name, Reporting Manager Name, Client Name, Project Name, Day Type, Hours, Comments

**Date format**: `dd/mm/yyyy` (en-GB locale)
**Day format**: Full day name (`Monday`, `Tuesday`, etc.)
**All fields**: double-quoted, `"` in values escaped as `""`
**Line endings**: `\r\n` (CRLF)
**Filename pattern**: `{employeeId}_Timesheet_{dd-mm-yyyy}_to_{dd-mm-yyyy}.csv`

---

## 7. Notification Side Effects

| Trigger | Type | Title | Message |
|---------|------|-------|---------|
| Manager approves | `approval` | `"Timesheet Approved"` | `"Your entry for {DD MMM YYYY} has been approved."` |
| Manager denies | `denial` | `"Timesheet Denied"` | `"Your entry for {DD MMM YYYY} was denied. Reason: {reason}"` |
| Client approves submission | `client_approved` | `"Client Approved Your Timesheet"` | `"Your timesheet submitted to {client} was approved by {manager}."` |
| Client rejects submission | `client_rejected` | `"Client Rejected Your Timesheet"` | `"Your timesheet submitted to {client} was rejected by {manager}. Note: {note}"` (note optional) |

---

## 8. Month Lock Business Rules

- Lock check uses: `year = date.year()`, `month = date.month() + 1` (1-indexed)
- Month lock blocks: employee timesheet edit, employee timesheet delete
- Month lock does NOT block: manager approval/denial (status update)
- Lock creation: ADMIN only, 409 if already locked
- Lock deletion: ADMIN only, 404 if not found

---

## 9. Acceptance Gate Checklist

Before cutover, ALL of the following must be verified:

- [ ] All 15 frontend routes render without errors
- [ ] All 18 API endpoints return exact status codes from this contract
- [ ] All API response JSON shapes match this contract field-for-field
- [ ] All error messages match exactly (string comparison)
- [ ] Role-based access: ADMIN and EMPLOYEE each tested on restricted endpoints
- [ ] A non-admin editing or deleting another user's entry gets 404, not 403
- [ ] Month lock blocks employee edits
- [ ] Leave balance: debits on create, settles the delta on edit, refunds on delete,
      floors at zero, never negative
- [ ] Hours bands enforced on create and on patch, in both directions
- [ ] Duplicate work_date rejected with 409 on create and on date change
- [ ] Client approval token flow: invalid/already-responded/confirmed redirects all correct
- [ ] Email side effects fire with correct params (verified via mock/spy in tests)
- [ ] CSV column order and format matches exactly
- [ ] Notification records created with correct type/title/message strings
- [ ] Dev mode: `portal_role` cookie overrides role correctly
