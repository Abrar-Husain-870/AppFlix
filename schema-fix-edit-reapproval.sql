-- ============================================================
-- APPFLIX: FIX FOR EDITED APP RE-APPROVAL EDGE CASE
-- Run this in Supabase Dashboard -> SQL Editor
-- ============================================================
-- BUG PREVENTED:
-- Previously, when an already-approved app (e.g. lifetime free app
-- or paid app with 2 months remaining) was edited and re-approved by
-- an admin, the system treated it as a brand-new submission, wiping
-- out the remaining listing time and requiring a ₹79 fee again.
--
-- THIS SCRIPT:
-- Updates approve_project_entitlement() to preserve existing free
-- and active paid listings (including exact expires_at timestamps)
-- when an edited app is re-approved.
-- ============================================================

CREATE OR REPLACE FUNCTION public.approve_project_entitlement(p_project_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_status TEXT;
  v_project_name TEXT;
  v_approved_at TIMESTAMPTZ;
  v_listing_type TEXT;
  v_listing_paid BOOLEAN;
  v_listing_expires_at TIMESTAMPTZ;
  v_free_used BOOLEAN;
  v_slot_id UUID;
  v_slot_expires_at TIMESTAMPTZ;
  v_now TIMESTAMPTZ := NOW();
  v_caller_role user_role;
BEGIN
  -- Defense-in-depth authorization check
  IF auth.role() != 'service_role' THEN
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
    IF v_caller_role IS NULL OR v_caller_role != 'admin' THEN
      RAISE EXCEPTION 'Unauthorized: Only admins or service_role can approve project entitlements';
    END IF;
  END IF;

  -- 1. Fetch & lock project row with existing listing metadata
  SELECT user_id, status, name, approved_at, listing_type, listing_paid, listing_expires_at
  INTO v_user_id, v_status, v_project_name, v_approved_at, v_listing_type, v_listing_paid, v_listing_expires_at
  FROM public.projects
  WHERE id = p_project_id
  FOR UPDATE;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  IF v_status = 'approved' THEN
    RAISE EXCEPTION 'Project is already approved';
  END IF;

  -- 2. EDIT RE-APPROVAL PROTECTION:
  -- If this project was ALREADY previously approved, preserve its active entitlement!
  IF v_approved_at IS NOT NULL THEN
    -- CASE PRE-A: Lifetime free app re-approval
    IF v_listing_type = 'free' AND v_listing_paid = TRUE THEN
      UPDATE public.projects
      SET status = 'approved',
          approved_at = v_now,
          listing_type = 'free',
          listing_paid = TRUE,
          listing_expires_at = NULL,
          rejection_reason = NULL
      WHERE id = p_project_id;

      RETURN jsonb_build_object(
        'result', 'approved_existing_free',
        'user_id', v_user_id,
        'project_name', v_project_name,
        'listing_type', 'free',
        'listing_paid', true,
        'expires_at', NULL
      );

    -- CASE PRE-B: Active paid app re-approval with remaining time (e.g. 2 months left)
    ELSIF v_listing_type = 'paid' AND v_listing_paid = TRUE AND v_listing_expires_at > v_now THEN
      UPDATE public.projects
      SET status = 'approved',
          approved_at = v_now,
          listing_type = 'paid',
          listing_paid = TRUE,
          listing_expires_at = v_listing_expires_at, -- PRESERVES EXACT EXPIRY DATE AND DAYS LEFT!
          rejection_reason = NULL
      WHERE id = p_project_id;

      RETURN jsonb_build_object(
        'result', 'approved_existing_paid',
        'user_id', v_user_id,
        'project_name', v_project_name,
        'listing_type', 'paid',
        'listing_paid', true,
        'expires_at', v_listing_expires_at
      );
    END IF;
  END IF;

  -- 3. Lock developer profile row to serialize concurrent approvals for brand new submissions
  SELECT free_listing_used INTO v_free_used
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_free_used IS NULL THEN
    RAISE EXCEPTION 'Developer profile not found';
  END IF;

  -- 4. Brand New Project Entitlement Evaluation
  IF NOT v_free_used THEN
    -- CASE A: First approved project -> permanent free listing
    UPDATE public.profiles
    SET free_listing_used = TRUE
    WHERE id = v_user_id;

    UPDATE public.projects
    SET status = 'approved',
        approved_at = v_now,
        listing_type = 'free',
        listing_paid = TRUE,
        listing_expires_at = NULL,
        rejection_reason = NULL
    WHERE id = p_project_id;

    RETURN jsonb_build_object(
      'result', 'approved_free',
      'user_id', v_user_id,
      'project_name', v_project_name,
      'listing_type', 'free',
      'listing_paid', true,
      'expires_at', NULL
    );
  ELSE
    -- Check for active reusable paid slot
    SELECT id, expires_at INTO v_slot_id, v_slot_expires_at
    FROM public.listing_slots
    WHERE user_id = v_user_id
      AND status = 'paid'
      AND expires_at > v_now
      AND project_id IS NULL
    ORDER BY expires_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_slot_id IS NOT NULL THEN
      -- CASE B: Active reusable paid slot found -> assign slot & preserve original expires_at
      UPDATE public.listing_slots
      SET project_id = p_project_id
      WHERE id = v_slot_id;

      UPDATE public.projects
      SET status = 'approved',
          approved_at = v_now,
          listing_type = 'paid',
          listing_paid = TRUE,
          listing_expires_at = v_slot_expires_at,
          rejection_reason = NULL
      WHERE id = p_project_id;

      RETURN jsonb_build_object(
        'result', 'approved_reused_slot',
        'user_id', v_user_id,
        'project_name', v_project_name,
        'listing_type', 'paid',
        'listing_paid', true,
        'expires_at', v_slot_expires_at
      );
    ELSE
      -- CASE C: Additional project, no reusable slot -> set as paid, unpaid (requires ₹79 payment)
      UPDATE public.projects
      SET status = 'approved',
          approved_at = v_now,
          listing_type = 'paid',
          listing_paid = FALSE,
          listing_expires_at = NULL,
          rejection_reason = NULL
      WHERE id = p_project_id;

      RETURN jsonb_build_object(
        'result', 'approved_unpaid',
        'user_id', v_user_id,
        'project_name', v_project_name,
        'listing_type', 'paid',
        'listing_paid', false,
        'expires_at', NULL
      );
    END IF;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_project_entitlement(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_project_entitlement(UUID) TO service_role;
