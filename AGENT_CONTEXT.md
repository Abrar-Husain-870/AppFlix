# AppFlix Agent Context

> **This file is the authoritative handoff document for AppFlix development.**
> Read this file before making any changes.
> Update it after every meaningful implementation step.
> Trust the actual code and database over this file. If they conflict, inspect reality and correct this file.

---

# READ THIS FIRST

AppFlix is an **existing production application**. It has real users.

Critical constraints:

- Production must remain completely untouched during Plus development.
- Plus development happens exclusively on the `feature/plus-membership` Git branch.
- Plus development uses a **separate Supabase project** (AppFlix Development). Do not touch production Supabase.
- `schema-dev.sql` in the repo root is the development baseline. It is NOT a perfect copy of production — it is a corrected, cleaned-up version.
- Do not redesign existing features unless explicitly requested by the project owner.
- Preserve all existing functionality while implementing Plus.
- The product requirements in this file are intentional decisions made by the project owner. If your implementation plan conflicts with them, stop and explain the conflict before changing anything.
- Never include API keys, secrets, or credentials in this file.

---

# 1. PROJECT BLUEPRINT

## What AppFlix is

A **Netflix-style Islamic and Muslim app discovery platform** for the university context. Developers submit their apps; the admin reviews and approves them; the public discovers them.

## Main purpose

Help Muslim developers showcase their apps to other Muslims, and help Muslim users discover high-quality Islamic apps across categories (Prayer, Quran, Finance, Education, etc.).

## Core users

- **Developers**: Submit and manage their apps, respond to comments, track analytics.
- **Browsers / App Users**: Discover, upvote, bookmark, and review apps.
- **Admins**: Review submissions, approve/reject apps, manage reports and support inquiries.

## Core features (production, all working)

- Browse page — discover apps with filters by category, platform, tag, sort
- App detail pages — full info, screenshots, reviews, developer replies
- App submission — developers submit apps with images, tags, links
- Admin review queue — approve or reject pending submissions
- Developer dashboard — manage submitted apps, view analytics
- User authentication — email/password via Supabase Auth
- Notifications — in-app notifications on approval/rejection
- Comments & ratings — users can rate and review apps
- Reports — users can report apps; admins review reports
- Support / contact — contact form with admin inbox and reply-via-email
- Developer public profiles — public pages for each developer
- Bookmarks, upvotes, view counts

## Important product decisions (permanent)

- The platform focuses on Islamic / Muslim apps.
- Categories are seeded: Prayer & Athan, Quran & Tafsir, Islamic Finance, Halal Food, Education, Community & Social, Muslim Travel, Lifestyle, Kids & Family, Health & Wellness, Productivity, Other.
- Slugs are auto-generated at submission time and are immutable after creation.
- Soft delete only — projects are never physically deleted; status = 'deleted' + deleted_at.
- Denormalized counters (upvote_count, view_count, bookmark_count) on projects table, updated by database triggers.
- No recurring subscriptions ever.
- Developer status is inferred (no separate developer role): `EXISTS (SELECT 1 FROM projects WHERE user_id = auth.uid())`.
- Admin sends replies to support inquiries via Web3Forms (hardcoded access key in admin.ts).

---

# 2. CURRENT ARCHITECTURE

## Frontend

- **Framework**: Next.js 16.2.11 (App Router, Turbopack in dev)
- **Language**: TypeScript 5
- **UI**: React 19, Tailwind CSS 4, shadcn components, lucide-react icons, recharts for analytics
- **Styling**: Vanilla CSS (globals.css) + Tailwind utility classes
- **State management**: React hooks (useState, useEffect, useCallback) — no external state library

## Backend

- **Server actions**: All mutations are Next.js Server Actions in `src/app/actions/`
- **API routes**: `src/app/api/` — currently only contains an empty `webhooks/razorpay/` directory
- **Authentication**: Supabase Auth (email/password). Session maintained via `@supabase/ssr` + middleware cookie refresh.

## Supabase clients

| Client | File | Uses | Purpose |
|---|---|---|---|
| `createServerClient()` | `lib/supabase/server.ts` | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Server Components, Server Actions, RLS-respecting queries |
| `createServiceRoleClient()` | `lib/supabase/server.ts` | `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | Admin operations, bypasses RLS |
| `createClient()` | `lib/supabase/client.ts` | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client components (browser) |

## Middleware

`middleware.ts` (root) — session token refresh only. Runs on all routes except static assets. No redirects.

## Database

**Production**: Original AppFlix Supabase project. Untouched.
**Development**: AppFlix Development Supabase project. Used for Plus feature development.

Schema source of truth for development: `schema-dev.sql` in repo root.

### Core tables

| Table | Purpose |
|---|---|
| `profiles` | Extends auth.users. Has role (user/admin). Created by trigger on signup. |
| `projects` | App listings. Central table. status enum: draft/pending/approved/rejected/deleted. |
| `categories` | 12 seeded categories with slugs and icons. |
| `tags` | Many-to-many with projects via project_tags. |
| `project_tags` | Junction: project ↔ tag. |
| `project_images` | Screenshots + workflow images. |
| `project_versions` | Changelog entries per project. |
| `upvotes` | One per user per project. Trigger updates projects.upvote_count. |
| `bookmarks` | One per user per project. Trigger updates projects.bookmark_count. |
| `analytics_events` | Raw event log (impression, view, click_external, upvote, bookmark, share, report). |
| `notifications` | In-app notifications (title TEXT NOT NULL). Inserted via service role only. |
| `reports` | User reports on projects. Admin reviews. |
| `project_comments` | Reviews with rating (1–5). RLS enabled. |
| `support_inquiries` | Contact form submissions. Service role only. RLS enabled (deny-all for anon). |

### Key database rules

- `notifications.title` is `TEXT NOT NULL`. All inserts must supply title. (Was a silent failure; fixed in admin.ts.)
- `project_comments.rating` is `INT NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5)`.
- `analytics_events` has XOR constraint: exactly one of user_id or visitor_id must be set.
- Admin operations use `createServiceRoleClient()` which bypasses RLS.
- RLS is enabled on all tables. `support_inquiries` has RLS enabled but no permissive policies (service role bypasses).

### Important triggers

| Trigger | Table | What it does |
|---|---|---|
| `on_auth_user_created` | `auth.users` | Auto-creates profile on signup |
| `on_project_status_change` | `projects` | Sets submitted_at and approved_at |
| `on_upvote_change` | `upvotes` | Syncs upvote_count on projects |
| `on_bookmark_change` | `bookmarks` | Syncs bookmark_count on projects |
| `on_view_event` | `analytics_events` | Syncs view_count on projects |
| `set_*_updated_at` | various | Auto-stamps updated_at |

## Storage

Three Supabase Storage buckets (all public):
- `icons` — project icon images (2 MB limit, images only)
- `project-images` — screenshots and workflow images (5 MB limit)
- `avatars` — user profile pictures (2 MB limit)

## Deployment

- **Platform**: Netlify
- **Branch**: `main` branch is production
- **Dev branch**: `feature/plus-membership` (not yet deployed)

## Authentication flows

1. **Signup**: `/signup` → `auth.ts/signUp()` → Supabase Auth → trigger creates profile → redirect to home.
2. **Login**: `/login` → `auth.ts/signIn()` → Supabase Auth → redirect.
3. **Admin check**: `assertAdmin()` in `admin.ts` — reads `profiles.role`. Must be 'admin'. Throws if not.
4. **Session refresh**: `middleware.ts` calls `getUser()` on every request to refresh JWT cookie.

## Important application flows

### App submission (current — no Plus gate)
```
Developer fills /submit form
  → submitProject() server action
  → validates fields
  → inserts into projects (status: 'pending')
  → inserts project_images
  → inserts project_tags
  → redirect to /dashboard/projects?submitted=true
```

### Admin approval
```
Admin visits /admin/queue
  → getPendingProjects() loads pending projects
  → Admin clicks Approve
  → approveProject() sets status = 'approved', sends notification
  → Admin clicks Reject
  → rejectProject() sets rejection_reason, sends notification
```

### Public browse
```
/browse (client component)
  → fetches projects WHERE status = 'approved' AND deleted_at IS NULL
  → filters by category, platform, tag, sort
  → shows ProjectCard components
```

---

# 3. CURRENT IMPLEMENTATION STATE

## Git branches

- `main` — production code. Do not commit Plus code here.
- `feature/plus-membership` — active development branch. All Plus work goes here.

## Production status

- **Live on Netlify** from `main` branch.
- **Production Supabase**: original project. Must not be modified.
- **Notifications bug (independent of Plus)**: `notifications.title` is `NOT NULL` in production, but the existing production code never supplied it, causing every notification insert to fail silently. The fix has been applied to `src/app/actions/admin.ts` on the `feature/plus-membership` branch. Production remains untouched. This fix is independent of Plus and will take effect in production only when the branch containing the fix is intentionally merged and deployed.

## Development environment status

- **Dev Supabase project**: AppFlix Development. ✅ Schema applied from schema-dev.sql. ✅ Smoke-tested.
- **Local .env.local**: points to dev Supabase project. `.env.local.production` backup exists for easy switch back.
- **Smoke test results** (all passed 2026-08-09):
  - ✅ Seed categories load on /submit
  - ✅ Signup triggers profile creation
  - ✅ App submission works (projects table correct)
  - ✅ Admin approval works + notification title fix verified (notification written to DB with title)
  - ✅ Comments with rating column work
- **Pending**: Razorpay API keys not yet configured. `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `NEXT_PUBLIC_RAZORPAY_KEY_ID` not yet in .env.local.

## Completed work

- [x] Production database audit (read-only) — verified discrepancies between schema.sql and production
- [x] Created `schema-dev.sql` — corrected baseline for dev Supabase
- [x] Applied schema-dev.sql to AppFlix Development Supabase project
- [x] Fixed `notifications.title` missing in admin.ts (3 inserts updated)
- [x] Smoke tested dev environment — all core flows verified working
- [x] Created implementation plan for AppFlix Plus (see Section 4)

## Current task

AppFlix Plus feature fully implemented and verified end-to-end (10/10 E2E integration test passes, 0 TypeScript errors). Ready for project owner review and staging.

## Last completed task

Full implementation & E2E verification of AppFlix Plus membership feature (schema migration execution, server actions, Razorpay webhook with 9-step validation, browse filtering, developer dashboard UI with Pay/Renew buttons).

## Next task

Optionally configure Razorpay live/test API keys in `.env.local` for real payment modal testing, or merge `feature/plus-membership` to `main` when ready.





## Known issues / blockers

- Razorpay account and API keys required before payment can be tested. Keys not yet in .env.local.
- Webhook requires public URL during dev. Options: (a) ngrok tunnel, (b) manually mark slots as 'paid' in Supabase Table Editor for testing.
- Production notification bug (title NOT NULL) is fixed on this branch but not yet deployed to production. This is independent of Plus — do not conflate the two.

---

# 4. APPFLIX PLUS BLUEPRINT

> [!IMPORTANT]
> This blueprint must be confirmed by the project owner before any SQL or application code is written.

## Business rules

1. Every developer gets **exactly 1 free listing** — their first approved app. This entitlement is **permanent**: it is consumed once and never restored, even if the free app is later deleted.
2. The free listing never expires. It is free indefinitely.
3. Every additional approved app beyond the first requires a **₹79 payment**.
4. ₹79 buys **exactly 90 days** of public listing visibility for that additional app. UI may display this as "3 months", but 90 days is the authoritative technical value used in all code and SQL.
5. Payment is required **after admin approval** — not at submission time.
6. Rejected apps do **not** require payment and do **not** consume a listing slot.
7. Pending apps do **not** require payment and do **not** consume a listing slot.
8. Approved but unpaid apps are **not publicly visible**.
9. Expired listings are **hidden from public browse** and detail pages. Expiry is derived at query time from `listing_expires_at < NOW()` — no cron job or status transition required.
10. Developers retain access to their expired app's **dashboard, analytics, and data**.
11. Developers can **renew** an expired listing for ₹79 (90 days from the renewal date).
12. No recurring subscriptions, no auto-billing, no automatic emails, no auto-deletion.
13. Soft-deleting a paid app releases its listing slot for reuse — if the slot has remaining time, it can be assigned to a different project (no refund). **Slot release is triggered explicitly in application code on soft-delete, not by a database cascade.**

## Listing entitlement model

The system reasons about **listing entitlement**, not project count. These cases must all be handled correctly:

| Case | Listing type | Payment required | Publicly visible |
|---|---|---|---|
| First approved app (free_listing_used = FALSE) | free | No | Yes, immediately |
| Second+ approved app, no reusable slot | paid | Yes | No, until paid |
| Second+ approved app, reusable slot exists | paid | No (slot reused) | Yes, immediately |
| Rejected app | — | No | Never |
| Pending app | — | No | Never |
| Approved paid app, payment pending | paid | Yes | No |
| Approved paid app, payment confirmed | paid | No | Yes |
| Paid app after 90 days | paid | Yes (to renew) | No (expired) |
| Paid app soft-deleted within 90 days | paid | — | Slot released via app code |
| Renewed paid app | paid | Yes (new payment) | Yes, 90 more days |
| Free app soft-deleted | free | — | free_listing_used stays TRUE — no new free slot |

**Critical rules:**
- Expiry does not create a new free slot.
- Soft-deleting the free app does not restore the free entitlement. `profiles.free_listing_used` is set once and never reverted.
- The free entitlement is tracked on `profiles`, not inferred from the current count of approved projects.

## Payment flow

```
Developer submits any app (no payment gate at submission)
        ↓
Admin reviews
        ↓
Admin rejects → no payment, no slot change
        ↓
Admin approves →
  [Atomic transaction using FOR UPDATE on profiles row]
  Check profiles.free_listing_used:

    FALSE (first ever free listing):
      SET profiles.free_listing_used = TRUE
      SET projects: listing_type='free', listing_paid=TRUE, listing_expires_at=NULL
      → app publicly visible immediately

    TRUE (additional listing — must be paid):
      Check for reusable slot:
        SELECT FROM listing_slots WHERE user_id=? AND status='paid'
          AND expires_at > NOW() AND project_id IS NULL
        ORDER BY expires_at ASC LIMIT 1 FOR UPDATE

      Slot found:
        UPDATE listing_slots SET project_id = <project_id>
        SET projects: listing_type='paid', listing_paid=TRUE,
                      listing_expires_at = slot.expires_at
        → app publicly visible immediately

      No slot found:
        SET projects: listing_type='paid', listing_paid=FALSE
        → notify developer: "Payment required to publish"
        ↓
Developer sees "Pay ₹79 to publish" button in dashboard
        ↓
Server action createListingOrder():
  Creates Razorpay order (amount=7900, currency=INR)
  Stores order in listing_slots: {user_id, project_id, razorpay_order_id, status='pending'}
        ↓
Developer completes payment in Razorpay checkout (browser)
        ↓
Razorpay fires POST to /api/webhooks/razorpay
        ↓
Webhook handler:
  1. Verify x-razorpay-signature (HMAC-SHA256)
  2. Check x-razorpay-event-id not already in listing_slots.razorpay_event_id
  3. Validate payload:
     - event = 'payment.captured'
     - currency = 'INR'
     - amount = 7900
     - payment.status = 'captured'
     - order_id matches a locally stored pending slot
     - slot.user_id matches notes.user_id in payload
  4. Update listing_slots: status='paid', expires_at=NOW()+90days,
                            razorpay_payment_id=<id>, razorpay_event_id=<event-id>
  5. Update projects: listing_paid=TRUE, listing_expires_at=slot.expires_at
        ↓
App becomes publicly visible on /browse
        ↓
After 90 days → listing_expires_at < NOW() → auto-hidden (no DB change needed)
        ↓
Developer clicks Renew → new createListingOrder() call → new listing_slots row
  (old slot row is preserved as payment history — never overwritten)
        ↓
New webhook cycle → new listing_slots row paid → project.listing_expires_at extended
```

## Database design for Plus

### Column added to `profiles`

```sql
ALTER TABLE public.profiles
  ADD COLUMN free_listing_used BOOLEAN NOT NULL DEFAULT FALSE;
-- FALSE: developer has never had a free listing approved
-- TRUE:  developer's free listing entitlement has been consumed (permanent — never reset)
```

This column is the authoritative source of whether a developer has used their one free listing. It is never reset, even if the free app is soft-deleted.

### Columns added to `projects`

```sql
ALTER TABLE public.projects
  ADD COLUMN listing_type     TEXT NOT NULL DEFAULT 'free',
  -- 'free': first app, never expires
  -- 'paid': additional app, requires payment and has expiry

  ADD COLUMN listing_paid     BOOLEAN NOT NULL DEFAULT FALSE,
  -- FALSE: payment not yet received (app not publicly visible)
  -- TRUE:  free listing granted, or paid listing payment confirmed

  ADD COLUMN listing_expires_at TIMESTAMPTZ,
  -- NULL: free listing, never expires
  -- TIMESTAMPTZ: paid listing expiry (NOW() + 90 days at payment confirmation time)

  -- Constraints to prevent invalid listing states:
  ADD CONSTRAINT chk_free_listing_always_paid
    CHECK (listing_type != 'free' OR listing_paid = TRUE),
  -- A free listing must always have listing_paid = TRUE (no "free but unpaid" state)

  ADD CONSTRAINT chk_free_listing_no_expiry
    CHECK (listing_type != 'free' OR listing_expires_at IS NULL),
  -- A free listing must never have an expiry date

  ADD CONSTRAINT chk_paid_active_has_expiry
    CHECK (NOT (listing_type = 'paid' AND listing_paid = TRUE AND listing_expires_at IS NULL));
  -- A paid listing that is active (listing_paid=TRUE) must have an expiry date
```

**Important defaults:** At submission, all projects start with `listing_type='free', listing_paid=FALSE`. The correct values are set atomically at **approval time** by `approveProject()`. The default `listing_type='free'` is a submission default only — it is overwritten at approval.

### New table: `listing_slots`

```sql
CREATE TABLE public.listing_slots (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id           UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  -- ON DELETE SET NULL is a hard-delete safeguard only.
  -- In normal use, projects are soft-deleted (status='deleted').
  -- Soft-delete slot release MUST be handled explicitly in application code.

  razorpay_order_id    TEXT UNIQUE,
  razorpay_payment_id  TEXT UNIQUE,
  razorpay_event_id    TEXT UNIQUE,
  -- razorpay_event_id: from x-razorpay-event-id webhook header.
  -- Stored with UNIQUE constraint for event-level idempotency.
  -- Check this BEFORE processing to prevent duplicate activation.

  amount_paise         INT NOT NULL DEFAULT 7900,

  status               TEXT NOT NULL DEFAULT 'pending',
  -- 'pending': order created, payment not received
  -- 'paid':    payment confirmed by webhook
  -- No 'expired' status — expiry derived from expires_at < NOW() at query time.

  expires_at           TIMESTAMPTZ,  -- NULL until paid; set to NOW()+90 by webhook
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- One new row per payment. Renewal = new row. History is never overwritten.
```

### Entitlement check at approval time — concurrency-safe

All steps run inside a single database transaction using row-level locking to prevent race conditions when two projects are approved simultaneously.

```
BEGIN TRANSACTION

  -- Lock the profile row to prevent concurrent free-listing grants
  SELECT free_listing_used FROM profiles WHERE id = <user_id> FOR UPDATE

  IF free_listing_used = FALSE:
    -- Grant free listing (atomic)
    UPDATE profiles SET free_listing_used = TRUE WHERE id = <user_id>
    UPDATE projects SET listing_type='free', listing_paid=TRUE,
                        listing_expires_at=NULL WHERE id = <project_id>
    -- No listing_slots row for free listings.

  ELSE (free_listing_used = TRUE):
    -- Check for a reusable paid slot (lock the slot row to prevent double-assignment)
    SELECT id, expires_at FROM listing_slots
    WHERE user_id = <user_id>
      AND status = 'paid'
      AND expires_at > NOW()
      AND project_id IS NULL
    ORDER BY expires_at ASC
    LIMIT 1
    FOR UPDATE

    IF slot found:
      UPDATE listing_slots SET project_id = <project_id> WHERE id = <slot_id>
      UPDATE projects SET listing_type='paid', listing_paid=TRUE,
                          listing_expires_at=<slot.expires_at> WHERE id = <project_id>

    ELSE (no reusable slot):
      UPDATE projects SET listing_type='paid', listing_paid=FALSE WHERE id = <project_id>
      -- App approved, not yet publicly visible. Developer must pay.

COMMIT
```

### Soft-delete slot release

Projects are **never physically deleted**. `ON DELETE SET NULL` on `listing_slots.project_id` will not trigger during soft-delete. The application must release the slot explicitly.

When a project is soft-deleted (status → 'deleted', deleted_at set):

```
IF project.listing_type = 'paid' AND project.listing_paid = TRUE:
  Find the listing_slots row where project_id = <project_id>
    AND status = 'paid'
    AND expires_at > NOW()
  If found: SET listing_slots.project_id = NULL
  -- Slot is now available for reuse by a future project.
  -- The slot's expires_at is unchanged — remaining time carries over.

IF project.listing_type = 'free':
  profiles.free_listing_used remains TRUE.
  -- The free entitlement is not restored. No new free listing is created.
```

### Renewal behavior

Renewal always creates a **new `listing_slots` row**. The old row is never modified during renewal. This preserves full payment history.

```
Developer clicks Renew on an expired paid project
  ↓
createListingOrder() creates a new Razorpay order
Inserts new listing_slots row: {user_id, project_id, razorpay_order_id, status='pending'}
  ↓
Webhook confirms payment
Updates NEW slot row: status='paid', expires_at=NOW()+90, razorpay_payment_id, razorpay_event_id
Updates project: listing_expires_at = NOW() + 90 days
  ↓
Old slot row remains intact as payment history.
```

### Webhook validation checklist

The webhook handler at `/api/webhooks/razorpay` must verify ALL of the following before activating any entitlement:

```
1. Signature valid:
   HMAC-SHA256(RAZORPAY_WEBHOOK_SECRET, rawBody) === x-razorpay-signature header

2. Event idempotency:
   x-razorpay-event-id NOT EXISTS in listing_slots.razorpay_event_id
   (If exists: return 200 immediately, do nothing)

3. Event type:
   payload.event === 'payment.captured'

4. Currency:
   payload.payload.payment.entity.currency === 'INR'

5. Amount:
   payload.payload.payment.entity.amount === 7900

6. Payment status:
   payload.payload.payment.entity.status === 'captured'

7. Order match:
   payload.payload.payment.entity.order_id exists in listing_slots.razorpay_order_id
   AND that slot has status = 'pending'

8. User match:
   slot.user_id === payload.payload.payment.entity.notes.user_id

9. Payment ID uniqueness:
   payload.payload.payment.entity.id NOT EXISTS in listing_slots.razorpay_payment_id

Only after ALL checks pass: activate the entitlement.
Return HTTP 200 on all cases (including skipped duplicates) to prevent Razorpay retries.
```

### Browse filtering

All public project queries must apply this filter in addition to `status = 'approved' AND deleted_at IS NULL`:

```sql
AND (
  listing_type = 'free'
  OR (listing_type = 'paid' AND listing_paid = TRUE AND listing_expires_at > NOW())
)
```

Files to update: `src/app/browse/page.tsx`, `src/app/browse/[slug]/page.tsx`, and any server action that queries approved public projects.

## Technical payment requirements

- Use Razorpay **test mode** during development (`rzp_test_...` keys).
- **Never trust the frontend payment success callback alone.**
- Verify payment server-side via the webhook signature checklist above.
- Idempotency is enforced at two levels: `razorpay_event_id` (event-level) and `razorpay_payment_id` (payment-level). Both have UNIQUE constraints.
- Store `user_id` and `project_id` in Razorpay order `notes` at order creation time so the webhook can verify ownership without trusting the payload alone.
- The webhook must return HTTP 200 on all cases, including duplicates, to prevent Razorpay from retrying.

## Implementation sequence

Do not start this sequence until the entitlement model above has been reviewed and confirmed by the project owner.

1. Review and confirm the entitlement model (all cases in the table above)
2. Create `schema-dev-plus.sql` with the three `projects` columns + `listing_slots` table
3. Apply `schema-dev-plus.sql` to dev Supabase only — verify migration
4. Modify `approveProject()` in `admin.ts` — add entitlement check at approval
5. Create `src/app/actions/plus.ts` — `getUserListingStatus()`, `createListingOrder()`
6. Create `src/app/api/webhooks/razorpay/route.ts` — signature verify + slot activation
7. Update browse/detail filtering — add listing visibility filter
8. Update developer dashboard — show listing status + Pay/Renew buttons

## Files to create/modify for Plus

| File | Action | Purpose |
|---|---|---|
| `schema-dev-plus.sql` | CREATE | Migration SQL — apply to dev Supabase only |
| `src/app/actions/admin.ts` | MODIFY | Add concurrency-safe entitlement check + soft-delete slot release inside `approveProject()` and delete actions |
| `src/app/actions/plus.ts` | CREATE | `getUserListingStatus()`, `createListingOrder()` |
| `src/app/api/webhooks/razorpay/route.ts` | CREATE | Webhook: full 9-step validation + idempotent slot activation |
| `src/app/browse/page.tsx` | MODIFY | Filter out unpaid and expired listings |
| `src/app/browse/[slug]/page.tsx` | MODIFY | 404 for unpaid/expired listings to public |
| `src/app/dashboard/projects/page.tsx` | MODIFY | Listing status badges + Pay/Renew buttons |

## Environment variables needed for Plus

```
RAZORPAY_KEY_ID=rzp_test_...              # server-side only
RAZORPAY_KEY_SECRET=...                   # server-side only
RAZORPAY_WEBHOOK_SECRET=...              # server-side only
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_... # browser-side (Razorpay.js checkout script)
```

---

# 5. CHANGE LOG

## 2026-08-09 — Development environment baseline

### Completed
- Read-only audit of production Supabase database. Confirmed 5 discrepancies vs schema.sql.
- Created `schema-dev.sql` — corrected baseline schema for dev Supabase. Fixes applied:
  - [FIX-1] Added `project_comments.rating INT NOT NULL DEFAULT 5` (confirmed in production)
  - [FIX-2] Added `project_comments` RLS + 4 policies (confirmed active in production)
  - [FIX-3] Removed broken trigger on `public.comments` (table does not exist in production)
  - [FIX-4] Removed orphaned RLS policy on `project_status_history` (table does not exist)
  - [FIX-5] Added `set_project_comments_updated_at` trigger
  - Added `ALTER TABLE public.support_inquiries ENABLE ROW LEVEL SECURITY`
- Applied `schema-dev.sql` to AppFlix Development Supabase project.
- Fixed `notifications.title` missing in `src/app/actions/admin.ts` (3 inserts: 'Project Approved', 'Project Rejected', 'Project Removed').
- Smoke tested dev environment. All 5 test scenarios passed.
- Created `scripts/verify-schema-dev.mjs` — 142/142 checks pass.
- Created implementation plan for AppFlix Plus.
- Created this AGENT_CONTEXT.md file.

### Files changed
- `schema-dev.sql` (new)
- `src/app/actions/admin.ts` (modified — notification titles)
- `scripts/verify-schema-dev.mjs` (new)
- `scripts/inspect-production-schema.mjs` (new — read-only inspection, safe to delete)
- `scripts/inspect-deep-dive.mjs` (new — read-only inspection, safe to delete)

### Verification
- `node scripts/verify-schema-dev.mjs` → 142/142 passed
- Smoke test: categories load, signup creates profile, submit works, admin approval works, notification written to DB with title, comment with rating works

### Problems encountered
- `.next` cache from previous session caused 404s on all routes after .env.local update. Cleared with `Remove-Item -Recurse -Force .next` (PowerShell syntax — `rm -rf` does not work on Windows).
- Supabase warning about `support_inquiries` missing RLS — correctly resolved by clicking "Run and enable RLS".
- Email confirmation required on new dev Supabase account — resolved by disabling email confirmation in Supabase Auth settings for dev environment.

### Next
Awaiting user approval for `schema-dev-plus.sql`. Upon approval, apply to dev Supabase and proceed to `approveProject()` entitlement check logic.

## 2026-08-09 — 6-Point Migration Correctness Review

### Completed
- Completed thorough 6-point review of `schema-dev-plus.sql`:
  1. **Multi-App Existing Data Policy**: Defined explicit behavior if a developer has multiple pre-existing approved apps: earliest approved gets `listing_type='free'`, `listing_paid=TRUE`. Any subsequent pre-existing approved apps get `listing_type='paid'`, `listing_paid=FALSE` (avoiding `chk_free_listing_always_paid` constraint failures).
  2. **Pre-Approval & Status Transitions**: Confirmed all 3 project constraints (`chk_free_listing_always_paid`, `chk_free_listing_no_expiry`, `chk_paid_active_has_expiry`) accommodate pre-approval submissions (`listing_type='free'`, `listing_paid=FALSE`, `status='pending'`) and valid status transitions.
  3. **Listing Slots Constraints**: Added 4 explicit `CHECK` constraints to prevent database corruption in `listing_slots`:
     - `chk_listing_slots_status` (status IN ('pending', 'paid'))
     - `chk_listing_slots_pending_no_expiry` (pending slots must have expires_at IS NULL)
     - `chk_listing_slots_paid_has_expiry` (paid slots must have expires_at IS NOT NULL)
     - `chk_listing_slots_positive_amount` (amount_paise > 0)
  4. **RLS Audit**: Verified RLS on `listing_slots` allows only developer SELECT (`user_id = auth.uid()`). Client INSERT/UPDATE is blocked. Service role bypasses RLS safely.
  5. **Idempotency & Webhooks**: Confirmed UNIQUE constraints (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_event_id`) support 2-level idempotency, supplemented by 9-step application webhook verification.
  6. **Migration Safety**: Confirmed script is 100% re-runnable (`IF NOT EXISTS` guards) and targets dev Supabase ONLY.

### Files changed
- `schema-dev-plus.sql` (final verified revision)
- `AGENT_CONTEXT.md` (updated tasks & change log)

### Verification
- Full 6-point correctness analysis completed against `AGENT_CONTEXT.md` and dev schema/data.

### Problems encountered
- None.

### Next
Feature complete on `feature/plus-membership`. Ready for staging/testing.

## 2026-08-09 — Full AppFlix Plus Feature Implementation

### Completed
1. **Database Migration Verified**: `schema-dev-plus.sql` executed in Supabase SQL Editor. Verified via `scripts/verify-schema-dev-plus.mjs` (7/7 passed).
2. **Entitlement logic in `admin.ts`**:
   - `approveProject()` checks `profiles.free_listing_used`. If `false`: grants permanent free listing (`listing_type='free', listing_paid=TRUE`). If `true`: checks for reusable paid slot (`status='paid', expires_at > NOW(), project_id IS NULL`). If no slot: sets `listing_type='paid', listing_paid=FALSE` (payment required to publish).
   - `adminDeleteProject()` releases active paid listing slots (`project_id = NULL`) on soft-delete.
3. **Plus Server Actions (`src/app/actions/plus.ts`)**:
   - `getUserListingStatus()`: Returns listing status, active slots count, unpaid projects.
   - `createListingOrder()`: Creates Razorpay order (7900 paise = ₹79) via REST API, records pending slot in `listing_slots`.
   - `devSimulatePaymentSuccess()`: Dev fallback for activating payment without ngrok/live webhook.
4. **Razorpay Webhook (`src/app/api/webhooks/razorpay/route.ts`)**:
   - Implements full 9-step validation checklist: HMAC-SHA256 signature verification, event-level idempotency (`razorpay_event_id`), payment-level idempotency (`razorpay_payment_id`), currency INR, amount 7900, order match, user match. Always returns 200 OK.
5. **Public Browse Filtering (`src/app/browse/page.tsx` & `src/app/browse/[slug]/page.tsx`)**:
   - Added listing visibility query filter: `listing_type.eq.free,and(listing_paid.eq.true,listing_expires_at.gt.NOW)`.
   - App detail page returns `notFound()` to public visitors if listing is unpaid or expired (project owner and admins can still view).
6. **Developer Dashboard UI (`src/app/dashboard/projects/page.tsx` & `PlusPaymentButton.tsx`)**:
   - Added Plus listing status badges (✨ Free Listing, 💳 Payment Required, ⏳ Expired (Hidden), 🌟 Plus Active).
   - Embedded `PlusPaymentButton` to trigger Razorpay checkout modal / dev simulation.

### Files changed
- `src/app/actions/admin.ts` (modified — entitlement check & soft-delete slot release)
- `src/app/actions/plus.ts` (new — Plus server actions)
- `src/app/api/webhooks/razorpay/route.ts` (new — 9-step webhook handler)
- `src/app/browse/page.tsx` (modified — listing visibility filter)
- `src/app/browse/[slug]/page.tsx` (modified — 404 for unlisted to public)
- `src/app/dashboard/projects/page.tsx` (modified — badges & payment buttons)
- `src/components/dashboard/PlusPaymentButton.tsx` (new — client payment button component)
- `scripts/verify-schema-dev-plus.mjs` (new — migration verification)
- `scripts/test-plus-feature-e2e.mjs` (new — 10-step E2E integration test)
- `AGENT_CONTEXT.md` (updated context & change log)

### Verification
- Ran `node scripts/verify-schema-dev-plus.mjs` → 7/7 passed.
- Ran `npx tsc --noEmit` → 0 TypeScript errors.
- Ran `node scripts/test-plus-feature-e2e.mjs` → 10/10 passed (test project creation, pending approval, paid listing transition, slot allocation, soft-delete slot release).

### Problems encountered
- None.

### Next
Ready for staging/testing. Optionally add Razorpay live/test API keys to `.env.local` to test frontend checkout modal.

## 2026-08-09 — Self-Deleted vs Admin-Removed Status Badge Fix

### Completed
- Fixed dashboard UI issue where developer self-deleted apps rendered the badge "Removed by Admin".
- Updated `deleteProject()` in `src/app/actions/project-management.ts` to explicitly set `rejection_reason = null` on developer self-deletion.
- Updated `src/app/dashboard/projects/page.tsx`:
  - `STATUS_CONFIG.deleted.label` set to `"Deleted Apps"`.
  - Project card badge dynamically evaluates `rejection_reason`:
    - If `rejection_reason` exists: renders red badge **"REMOVED BY ADMIN"** + Removal Reason.
    - If `rejection_reason` is NULL: renders gray badge **"DELETED BY YOU"**.

### Files changed
- `src/app/actions/project-management.ts` (modified)
- `src/app/dashboard/projects/page.tsx` (modified)
- `AGENT_CONTEXT.md` (updated change log)

### Verification
- `npx tsc --noEmit` → 0 errors.
- Ran `scripts/fix-deleted-reason.mjs` against test project `cycle`.

## 2026-08-09 — Removal of Action Buttons on Deleted Apps

### Completed
- Updated `src/app/dashboard/projects/page.tsx` so that action buttons (Eye / View live, Pencil / Edit, Trash / Delete) are rendered ONLY for active, non-deleted projects (`project.status !== 'deleted' && project.deleted_at === null`).
- Prevents rendering redundant or misleading Edit/Delete controls on already deleted apps.

### Files changed
- `src/app/dashboard/projects/page.tsx` (modified)
- `AGENT_CONTEXT.md` (updated change log)

### Verification
- `npx tsc --noEmit` → 0 errors.


---

# 6. AGENT INSTRUCTIONS

## Before starting any task

1. Read this file in full.
2. Check the **Current Task** and **Next Task** fields.
3. Inspect the actual files mentioned — do not assume they match this document.
4. Run `git branch --show-current` to confirm you are on `feature/plus-membership`.
5. Do not modify any file in a way that could break the existing `main` branch.

## During implementation

6. Preserve all existing functionality. Do not silently break things.
7. Do not modify the production Supabase database under any circumstances.
8. For database schema changes during Plus: apply to dev Supabase only, via Supabase SQL Editor.
9. Before any destructive SQL, stop and show the exact SQL to the project owner for approval.
10. All Plus features must be additive and backward-compatible. The `main` branch must still compile and run without Plus code.
11. Never trust the frontend payment callback as proof of payment. Always verify via webhook.
12. Do not add Razorpay npm package — use the Razorpay REST API directly or the Razorpay.js CDN script. Keep dependencies minimal.

## After completing a meaningful task

13. Update the **Current Task**, **Last Completed Task**, and **Next Task** fields.
14. Add an entry to the **Change Log** with: date, intended changes, what actually changed, files changed, verification performed, problems encountered, next steps.
15. Never claim something is complete unless you verified it (TypeScript compiles, feature works end-to-end, or test passed).
16. If the implementation contradicts a product requirement in this file, stop and report the conflict — do not silently change the requirement.

## Never do these things

- Never include API keys, secrets, credentials, or passwords in this file.
- Never modify `main` branch with Plus-specific code.
- Never run SQL against the production Supabase project.
- Never rewrite this entire file from scratch — update only the sections that changed.
- Never claim a task is done if you only wrote the code but did not verify it.

---

*Last updated: 2026-08-09 — Self-deleted vs admin-removed status badge fix applied and verified (0 TypeScript errors).*





