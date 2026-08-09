-- ============================================================
-- APPFLIX PLUS MEMBERSHIP FEATURE MIGRATION (FINAL VERIFIED REVISION)
-- Target Database: AppFlix Development Supabase project ONLY
-- Date: 2026-08-09
-- ============================================================

-- ── 1. PROFILES ENHANCEMENT ─────────────────────────────────
-- Track whether developer has consumed their single permanent free app listing.
-- Defaults to FALSE. Set to TRUE on first approved project and NEVER reset.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS free_listing_used BOOLEAN NOT NULL DEFAULT FALSE;


-- ── 2. PROJECTS TABLE ENHANCEMENTS ──────────────────────────
-- Add listing type, payment confirmation, and expiration date columns.
-- Submission defaults: listing_type='free', listing_paid=FALSE, listing_expires_at=NULL
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS listing_type     TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS listing_paid     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS listing_expires_at TIMESTAMPTZ;


-- ── 3. EXISTING DATA MIGRATION ──────────────────────────────
-- For any developer with existing projects prior to Plus migration:
-- A) For developers with approved projects:
--    - Earliest approved project gets listing_type='free', listing_paid=TRUE
--    - Profile free_listing_used is set to TRUE
--    - Any subsequent pre-existing approved projects (2nd, 3rd...) are marked
--      as listing_type='paid', listing_paid=FALSE (unpaid, requiring payment to remain visible)
-- B) For unapproved projects (pending/draft/rejected):
--    - Set listing_type='free', listing_paid=FALSE (submission default)
DO $$
DECLARE
  rec RECORD;
  first_proj_id UUID;
BEGIN
  -- Handle developers with approved, non-deleted projects
  FOR rec IN
    SELECT DISTINCT user_id
    FROM public.projects
    WHERE status = 'approved' AND deleted_at IS NULL
  LOOP
    -- Mark profile as having consumed their free listing entitlement
    UPDATE public.profiles
    SET free_listing_used = TRUE
    WHERE id = rec.user_id;

    -- Identify earliest approved project
    SELECT id INTO first_proj_id
    FROM public.projects
    WHERE user_id = rec.user_id AND status = 'approved' AND deleted_at IS NULL
    ORDER BY approved_at ASC NULLS LAST, created_at ASC
    LIMIT 1;

    -- Set earliest approved project to free & active
    UPDATE public.projects
    SET listing_type = 'free',
        listing_paid = TRUE,
        listing_expires_at = NULL
    WHERE id = first_proj_id;

    -- Set any other pre-existing approved projects for this user to paid & unpaid
    -- (Prevents violation of chk_free_listing_always_paid constraint)
    UPDATE public.projects
    SET listing_type = 'paid',
        listing_paid = FALSE,
        listing_expires_at = NULL
    WHERE user_id = rec.user_id
      AND status = 'approved'
      AND deleted_at IS NULL
      AND id != first_proj_id;
  END LOOP;

  -- Ensure any pre-existing unapproved/deleted projects conform to submission defaults
  UPDATE public.projects
  SET listing_type = 'free',
      listing_paid = FALSE,
      listing_expires_at = NULL
  WHERE status != 'approved' OR deleted_at IS NOT NULL;
END $$;


-- ── 4. PROJECTS CHECK CONSTRAINTS ────────────────────────────
DO $$
BEGIN
  -- Approved free listing must be listing_paid = TRUE
  -- (Allows pending/draft/rejected free projects to be listing_paid = FALSE prior to approval)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_free_listing_always_paid') THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT chk_free_listing_always_paid
        CHECK (NOT (status = 'approved' AND listing_type = 'free' AND listing_paid = FALSE));
  END IF;

  -- Free listing must never have an expiration date
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_free_listing_no_expiry') THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT chk_free_listing_no_expiry
        CHECK (listing_type != 'free' OR listing_expires_at IS NULL);
  END IF;

  -- Paid listing marked as active (listing_paid = TRUE) must have an expiration date
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_paid_active_has_expiry') THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT chk_paid_active_has_expiry
        CHECK (NOT (listing_type = 'paid' AND listing_paid = TRUE AND listing_expires_at IS NULL));
  END IF;
END $$;

-- Index for fast public browse filtering
CREATE INDEX IF NOT EXISTS idx_projects_listing_visibility
  ON public.projects (status, deleted_at, listing_type, listing_paid, listing_expires_at)
  WHERE status = 'approved';


-- ── 5. LISTING SLOTS TABLE ──────────────────────────────────
-- Track paid 90-day listing slots and Razorpay payment history.
CREATE TABLE IF NOT EXISTS public.listing_slots (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id           UUID REFERENCES public.projects(id) ON DELETE SET NULL,

  -- Razorpay tracking & event-level / payment-level idempotency
  razorpay_order_id    TEXT UNIQUE,
  razorpay_payment_id  TEXT UNIQUE,
  razorpay_event_id    TEXT UNIQUE,

  amount_paise         INT NOT NULL DEFAULT 7900,  -- ₹79 in paise

  status               TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'paid'

  expires_at           TIMESTAMPTZ,                -- Set to NOW() + 90 days on webhook confirmation
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Listing slots integrity constraints
DO $$
BEGIN
  -- Status must be 'pending' or 'paid'
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_listing_slots_status') THEN
    ALTER TABLE public.listing_slots
      ADD CONSTRAINT chk_listing_slots_status
        CHECK (status IN ('pending', 'paid'));
  END IF;

  -- Pending slots must not have an expiration date
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_listing_slots_pending_no_expiry') THEN
    ALTER TABLE public.listing_slots
      ADD CONSTRAINT chk_listing_slots_pending_no_expiry
        CHECK (status != 'pending' OR expires_at IS NULL);
  END IF;

  -- Paid slots must have an expiration date
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_listing_slots_paid_has_expiry') THEN
    ALTER TABLE public.listing_slots
      ADD CONSTRAINT chk_listing_slots_paid_has_expiry
        CHECK (status != 'paid' OR expires_at IS NOT NULL);
  END IF;

  -- Amount must be positive
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_listing_slots_positive_amount') THEN
    ALTER TABLE public.listing_slots
      ADD CONSTRAINT chk_listing_slots_positive_amount
        CHECK (amount_paise > 0);
  END IF;
END $$;

-- Indexes for slot assignment lookups and developer dashboard
CREATE INDEX IF NOT EXISTS idx_listing_slots_user_status
  ON public.listing_slots (user_id, status, expires_at);

CREATE INDEX IF NOT EXISTS idx_listing_slots_project
  ON public.listing_slots (project_id);


-- ── 6. ROW LEVEL SECURITY FOR LISTING SLOTS ─────────────────
ALTER TABLE public.listing_slots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'listing_slots' AND policyname = 'ListingSlots: own read'
  ) THEN
    CREATE POLICY "ListingSlots: own read"
      ON public.listing_slots FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;
