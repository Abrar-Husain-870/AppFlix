-- ============================================================
-- APPFLIX: PRIVATE DEVELOPER FEEDBACK TABLE & POLICIES
-- Run this in Supabase Dashboard -> SQL Editor (for your active DB)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_feedback (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id           UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category             TEXT NOT NULL DEFAULT 'suggestion', -- 'suggestion', 'bug_report', 'question', 'general'
  message              TEXT NOT NULL,                      -- max 500 chars
  developer_reply      TEXT,                               -- max 500 chars
  developer_replied_at TIMESTAMPTZ,
  status               TEXT NOT NULL DEFAULT 'open',       -- 'open', 'replied', 'closed'
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One thread per user per app to cap row counts for free-tier DB protection
  CONSTRAINT uq_feedback_user_project UNIQUE (project_id, user_id)
);

-- Fast query indices
CREATE INDEX IF NOT EXISTS idx_project_feedback_dev ON public.project_feedback(project_id, status);
CREATE INDEX IF NOT EXISTS idx_project_feedback_user ON public.project_feedback(user_id);

-- Enable Row-Level Security
ALTER TABLE public.project_feedback ENABLE ROW LEVEL SECURITY;

-- 1. Users can view their own feedback, and developers can view feedback for their projects
CREATE POLICY "Feedback: read own or developer"
  ON public.project_feedback FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT p.user_id FROM public.projects p WHERE p.id = project_id)
  );

-- 2. Users can insert their own feedback
CREATE POLICY "Feedback: insert own"
  ON public.project_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own feedback, developers can update reply
CREATE POLICY "Feedback: update own or developer"
  ON public.project_feedback FOR UPDATE
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT p.user_id FROM public.projects p WHERE p.id = project_id)
  );

-- 4. Users can delete their own thread, developers can delete thread on their project
CREATE POLICY "Feedback: delete own or developer"
  ON public.project_feedback FOR DELETE
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT p.user_id FROM public.projects p WHERE p.id = project_id)
  );
