-- ============================================================
-- AppFlix Migration: Hardened Device-Based View Counting
-- Table: public.project_views
-- Rule: Max 1 view per app per recognized browser/device identity (no time limit).
--
-- Security Hardening:
--   1. SET search_path = '' to prevent search_path injection attacks in SECURITY DEFINER.
--   2. Fully-qualified schema references (pg_catalog.*, public.*).
--   3. REVOKE execution from anon and authenticated; GRANT strictly to service_role.
--      This prevents direct REST API spam / client forgery of device IDs.
--      All view recordings MUST pass through Next.js Server Action validation.
--   4. Atomically manages project_views, projects.view_count, and analytics_events
--      in a single transactional execution.
--   5. Drops legacy on_view_event trigger to prevent double-counting.
-- ============================================================

-- 1. Create table to track unique (project_id, device_id) pairs
CREATE TABLE IF NOT EXISTS public.project_views (
  id            pg_catalog.uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    pg_catalog.uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  device_id     pg_catalog.text NOT NULL,
  user_id       pg_catalog.uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  device_type   public.device_type,
  created_at    pg_catalog.timestamptz NOT NULL DEFAULT pg_catalog.now(),

  CONSTRAINT uq_project_device_view UNIQUE (project_id, device_id)
);

-- 2. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_project_views_project_id ON public.project_views(project_id);
CREATE INDEX IF NOT EXISTS idx_project_views_device_id  ON public.project_views(device_id);
CREATE INDEX IF NOT EXISTS idx_project_views_created_at ON public.project_views(created_at DESC);

-- 3. Row Level Security for project_views
ALTER TABLE public.project_views ENABLE ROW LEVEL SECURITY;

-- Allow project owner or admins to view analytics/records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'project_views' 
      AND policyname = 'ProjectViews: owner or admin read'
  ) THEN
    CREATE POLICY "ProjectViews: owner or admin read"
      ON public.project_views FOR SELECT
      USING (
        EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
        OR public.is_admin()
      );
  END IF;
END $$;

-- 4. CRITICAL: Drop old duplicate view counter trigger on analytics_events so views are never double-counted!
-- (The legacy trigger sync_view_count() was previously incrementing projects.view_count on every analytics_events insert)
DROP TRIGGER IF EXISTS on_view_event ON public.analytics_events;
DROP FUNCTION IF EXISTS public.sync_view_count();

-- 5. Secure atomic RPC function to record a device view
-- Security: SET search_path = '', SECURITY DEFINER, schema-qualified references throughout.
CREATE OR REPLACE FUNCTION public.record_project_view(
  p_project_id  pg_catalog.uuid,
  p_device_id   pg_catalog.text,
  p_device_type public.device_type DEFAULT NULL,
  p_user_id     pg_catalog.uuid DEFAULT NULL
)
RETURNS pg_catalog.jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_inserted   pg_catalog.bool := FALSE;
  v_user_id    pg_catalog.uuid := COALESCE(p_user_id, auth.uid());
  v_new_count  pg_catalog.int4;
BEGIN
  -- Validate input parameters
  IF p_project_id IS NULL OR p_device_id IS NULL OR pg_catalog.length(pg_catalog.btrim(p_device_id)) < 8 THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false, 
      'counted', false, 
      'error', 'Invalid project_id or device_id parameter'
    );
  END IF;

  -- Ensure project exists, is approved, and not soft-deleted
  IF NOT EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = p_project_id 
      AND status = 'approved' 
      AND deleted_at IS NULL
  ) THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false, 
      'counted', false, 
      'error', 'Project not found, not approved, or deleted'
    );
  END IF;

  -- Atomic insert with ON CONFLICT DO NOTHING
  -- If this (project_id, device_id) pair already exists, no row is inserted and v_inserted remains FALSE
  INSERT INTO public.project_views (project_id, device_id, user_id, device_type)
  VALUES (p_project_id, p_device_id, v_user_id, p_device_type)
  ON CONFLICT (project_id, device_id) DO NOTHING
  RETURNING TRUE INTO v_inserted;

  -- If this was a brand new device identity, increment projects.view_count & log analytics
  IF v_inserted IS TRUE THEN
    UPDATE public.projects
    SET view_count = view_count + 1
    WHERE id = p_project_id
    RETURNING view_count INTO v_new_count;

    -- Also record into analytics_events for developer time-series charts (7d/30d views)
    -- Satisfies chk_visitor_xor: exactly one of user_id or visitor_id is set
    INSERT INTO public.analytics_events (project_id, event_type, user_id, visitor_id, device_type)
    VALUES (
      p_project_id,
      'view'::public.event_type,
      v_user_id,
      CASE WHEN v_user_id IS NULL THEN p_device_id ELSE NULL END,
      p_device_type
    );

    RETURN pg_catalog.jsonb_build_object(
      'success', true, 
      'counted', true, 
      'view_count', v_new_count
    );
  ELSE
    -- Device already viewed this project in the past: no increment
    SELECT view_count INTO v_new_count 
    FROM public.projects 
    WHERE id = p_project_id;

    RETURN pg_catalog.jsonb_build_object(
      'success', true, 
      'counted', false, 
      'view_count', v_new_count
    );
  END IF;
END;
$$;

-- 6. Strict privilege isolation:
-- REVOKE execution from anon, authenticated, and public.
-- GRANT EXECUTE exclusively to service_role.
-- This ensures callers CANNOT bypass Next.js Server Action validation to spam fake device IDs.
REVOKE ALL ON FUNCTION public.record_project_view(pg_catalog.uuid, pg_catalog.text, public.device_type, pg_catalog.uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_project_view(pg_catalog.uuid, pg_catalog.text, public.device_type, pg_catalog.uuid) TO service_role;
