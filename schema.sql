-- ============================================================
-- DEENLIST CLONE — COMPLETE DATABASE SCHEMA
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

-- Platform moderation status. Answers: "Can this project exist on the platform?"
CREATE TYPE project_status AS ENUM (
  'draft',     -- saved by developer, not submitted
  'pending',   -- submitted, awaiting admin review
  'approved',  -- live and visible on the platform
  'rejected',  -- not approved; developer can revise and resubmit
  'deleted'    -- soft-deleted; hidden everywhere, FK integrity preserved
);

-- Developer-controlled maturity signal. Answers: "Is this app stable?"
CREATE TYPE project_stage AS ENUM (
  'beta',       -- functional but still being tested
  'production'  -- stable and actively maintained
);

-- Roles are purely about access level, not activity.
-- Developer status is inferred: EXISTS (SELECT 1 FROM projects WHERE user_id = auth.uid())
CREATE TYPE user_role AS ENUM (
  'user',   -- default: can browse, upvote, bookmark, and submit projects
  'admin'   -- full access: approve, reject, feature, delete
);

CREATE TYPE notification_type AS ENUM (
  'project_approved',  -- admin approved a submission
  'project_rejected',  -- admin rejected a submission
  'new_upvote',        -- someone upvoted the developer's project
  'system_notice'      -- platform announcements, maintenance notices
);

CREATE TYPE report_reason AS ENUM (
  'spam',
  'inappropriate',
  'broken_link',
  'not_relevant',
  'duplicate',
  'other'
);

CREATE TYPE report_status AS ENUM (
  'open',
  'reviewed',
  'dismissed',
  'actioned'
);

CREATE TYPE platform_type AS ENUM (
  'ios',
  'android',
  'web',
  'windows',
  'macos',
  'linux',
  'browser_extension'
);

CREATE TYPE event_type AS ENUM (
  'impression',      -- project card appeared in a browse listing
  'view',            -- project detail page was opened
  'click_external',  -- external link (website/store) was clicked
  'upvote',          -- project was upvoted
  'bookmark',        -- project was bookmarked
  'share',           -- share button was used
  'report'           -- project was reported (for moderation trend analytics)
);

CREATE TYPE image_type AS ENUM (
  'screenshot',  -- app screenshots shown in the detail page gallery
  'workflow'     -- "how it works" diagrams
);

CREATE TYPE device_type AS ENUM (
  'desktop',
  'tablet',
  'mobile'
);

-- ============================================================
-- PROFILES
-- Extends Supabase auth.users. Created automatically on signup.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.support_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_email TEXT DEFAULT 'husainabrar870@gmail.com',
  status TEXT DEFAULT 'unread',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE public.profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username       TEXT UNIQUE NOT NULL,
  display_name   TEXT,
  bio            TEXT CHECK (char_length(bio) <= 300),
  avatar_url     TEXT,
  website_url    TEXT,
  twitter_handle TEXT,
  github_url     TEXT,
  linkedin_url   TEXT,
  location       TEXT,
  role           user_role NOT NULL DEFAULT 'user',
  deleted_at     TIMESTAMPTZ,  -- soft delete: set on account deactivation
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_username ON public.profiles(username);
-- Note: no index on role — only 2 values (user/admin), PostgreSQL won't use it.

-- ============================================================
-- CATEGORIES
-- ============================================================

CREATE TABLE public.categories (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  icon        TEXT,          -- emoji or icon name
  color       TEXT,          -- hex color for UI
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_sort ON public.categories(sort_order);

-- Seed data
INSERT INTO public.categories (name, slug, icon, sort_order) VALUES
  ('Prayer & Athan',       'prayer',           '🕌', 1),
  ('Quran & Tafsir',       'quran',            '📖', 2),
  ('Islamic Finance',      'islamic-finance',  '💰', 3),
  ('Halal Food',           'halal-food',       '🍔', 4),
  ('Education',            'education',        '🎓', 5),
  ('Community & Social',   'community',        '👥', 6),
  ('Muslim Travel',        'travel',           '✈️', 7),
  ('Lifestyle',            'lifestyle',        '🌙', 8),
  ('Kids & Family',        'kids',             '👶', 9),
  ('Health & Wellness',    'health',           '💚', 10),
  ('Productivity',         'productivity',     '⚡', 11),
  ('Other',                'other',            '📦', 99);

-- ============================================================
-- TAGS
-- ============================================================

CREATE TABLE public.tags (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tags_slug ON public.tags(slug);

-- ============================================================
-- PROJECTS (Apps)
-- ============================================================

CREATE TABLE public.projects (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id       INT NOT NULL REFERENCES public.categories(id),

  -- Core fields
  name              TEXT NOT NULL CHECK (char_length(name) BETWEEN 3 AND 60),
  slug              TEXT NOT NULL UNIQUE,
  tagline           TEXT NOT NULL CHECK (char_length(tagline) BETWEEN 10 AND 120),
  description       TEXT NOT NULL CHECK (char_length(description) >= 50),

  -- Media
  icon_url          TEXT,

  -- Links
  website_url       TEXT,
  appstore_url      TEXT,
  playstore_url     TEXT,
  github_url        TEXT,
  documentation_url TEXT,

  -- Classification
  platforms         platform_type[] NOT NULL DEFAULT '{}',
  is_open_source    BOOLEAN NOT NULL DEFAULT FALSE,
  is_free           BOOLEAN NOT NULL DEFAULT TRUE,
  pricing_info      TEXT,              -- e.g. "Free / $4.99/mo Pro"

  -- Moderation status (platform-controlled)
  status            project_status NOT NULL DEFAULT 'draft',
  rejection_reason  TEXT,

  -- Development stage (developer-controlled, shown as badge on card)
  stage             project_stage NOT NULL DEFAULT 'production',

  is_featured       BOOLEAN NOT NULL DEFAULT FALSE,
  featured_at       TIMESTAMPTZ,
  featured_by       UUID REFERENCES public.profiles(id),

  -- Versioning
  current_version   TEXT,             -- e.g. "2.1.0"

  -- Denormalized counters (updated by triggers)
  upvote_count      INT NOT NULL DEFAULT 0,
  view_count        INT NOT NULL DEFAULT 0,
  bookmark_count    INT NOT NULL DEFAULT 0,

  -- Soft delete: set status = 'deleted' AND deleted_at = NOW().
  -- Never physically delete. FK integrity (analytics, upvotes, reports) stays intact.
  deleted_at        TIMESTAMPTZ,

  -- Timestamps
  submitted_at      TIMESTAMPTZ,
  approved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id    ON public.projects(user_id);
CREATE INDEX idx_projects_category   ON public.projects(category_id);
CREATE INDEX idx_projects_status     ON public.projects(status);
CREATE INDEX idx_projects_slug       ON public.projects(slug);
CREATE INDEX idx_projects_featured   ON public.projects(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_projects_approved   ON public.projects(approved_at DESC) WHERE status = 'approved';
CREATE INDEX idx_projects_upvotes    ON public.projects(upvote_count DESC) WHERE status = 'approved';
CREATE INDEX idx_projects_trending   ON public.projects(upvote_count DESC, approved_at DESC) WHERE status = 'approved';

-- Full-text search index
CREATE INDEX idx_projects_fts ON public.projects
  USING gin(to_tsvector('english', name || ' ' || tagline || ' ' || description));

-- ============================================================
-- PROJECT TAGS (many-to-many)
-- ============================================================

CREATE TABLE public.project_tags (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tag_id     INT  NOT NULL REFERENCES public.tags(id)     ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag_id)
);

CREATE INDEX idx_project_tags_tag ON public.project_tags(tag_id);

-- ============================================================
-- PROJECT VERSIONS (Changelog)
-- ============================================================

CREATE TABLE public.project_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version     TEXT NOT NULL,
  changelog   TEXT,
  released_at DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_versions_project ON public.project_versions(project_id, released_at DESC);

-- ============================================================
-- PROJECT IMAGES (unified: screenshots + workflow images)
-- icon_url lives on projects directly — it's a required 1:1 field, not a gallery item.
-- ============================================================

CREATE TABLE public.project_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  image_url     TEXT NOT NULL,
  image_type    image_type NOT NULL,   -- 'screenshot' | 'workflow'
  caption       TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevents two images of the same type sharing the same position within a project.
  -- e.g. two screenshots both at display_order=1 is impossible.
  UNIQUE (project_id, image_type, display_order)
);

CREATE INDEX idx_project_images_project ON public.project_images(project_id, image_type, display_order);

-- ============================================================
-- UPVOTES
-- ============================================================

CREATE TABLE public.upvotes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, project_id)
);

CREATE INDEX idx_upvotes_project ON public.upvotes(project_id);
CREATE INDEX idx_upvotes_user    ON public.upvotes(user_id);

-- ============================================================
-- BOOKMARKS
-- ============================================================

CREATE TABLE public.bookmarks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, project_id)
);

CREATE INDEX idx_bookmarks_user    ON public.bookmarks(user_id);
CREATE INDEX idx_bookmarks_project ON public.bookmarks(project_id);

-- ============================================================
-- ANALYTICS EVENTS (raw event log)
-- ============================================================

CREATE TABLE public.analytics_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  event_type    event_type NOT NULL,

  -- Exactly one of these must be present (XOR constraint).
  -- Logged-in users are identified by user_id.
  -- Guests are identified by visitor_id (UUID from localStorage — not an IP, not a fingerprint).
  user_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  visitor_id    TEXT,

  referrer      TEXT,
  country_code  TEXT,
  device_type   device_type,     -- 'desktop' | 'tablet' | 'mobile'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Enforce XOR: exactly one identifier must be set, never both and never neither.
  CONSTRAINT chk_visitor_xor CHECK (
    (user_id IS NOT NULL AND visitor_id IS NULL)
    OR
    (user_id IS NULL AND visitor_id IS NOT NULL)
  )
);

-- Primary query index: covers all per-project dashboard queries
CREATE INDEX idx_analytics_project   ON public.analytics_events(project_id, event_type, created_at DESC);
CREATE INDEX idx_analytics_type      ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_date      ON public.analytics_events(created_at DESC);

-- Unique visitor counting (no extra columns needed):
-- SELECT COUNT(DISTINCT COALESCE(user_id::TEXT, visitor_id))
-- FROM analytics_events
-- WHERE project_id = $1
--   AND event_type = 'view'   ← use the enum value exactly as defined above
--   AND DATE(created_at) = CURRENT_DATE;
--
-- This counts each user/visitor only once per day per project,
-- regardless of how many times they reload the page.
-- For all-time uniques: remove the DATE() filter.
--
-- Safe against typos because PostgreSQL rejects anything not in the
-- event_type enum at INSERT time — bad data never reaches the table.

-- Partition hint: in future, partition by month for scale.

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        notification_type NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT,
  link        TEXT,            -- relative URL e.g. '/dashboard/projects'
  project_id  UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()  -- reflects when is_read was set
);

CREATE INDEX idx_notifications_user   ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE is_read = FALSE;

-- ============================================================
-- REPORTS
-- ============================================================

CREATE TABLE public.reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id   UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  reason       report_reason NOT NULL,
  details      TEXT,
  status       report_status NOT NULL DEFAULT 'open',
  reviewed_by  UUID REFERENCES public.profiles(id),
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_project ON public.reports(project_id);
CREATE INDEX idx_reports_status  ON public.reports(status) WHERE status = 'open';

-- ============================================================
-- PROJECT COMMENTS & REVIEWS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_comments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id           UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  headline             TEXT NOT NULL,
  comment              TEXT NOT NULL,
  developer_reply      TEXT,
  developer_replied_at TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_comments_project ON public.project_comments(project_id, created_at DESC);

-- Note: project_status_history was intentionally removed.
-- Reason: the log_status_change trigger called auth.uid() which returns NULL
-- when using the service role key in Server Actions, causing NOT NULL violations
-- on every admin approval/rejection. The information it captured (who approved,
-- when) is already stored in projects.approved_at and projects.rejection_reason.
-- If a full audit log is needed later, add it as a separate application-level insert
-- in the Server Action itself, where the user session is available.

-- ============================================================
-- TRIGGERS
-- ============================================================

-- 1. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
BEGIN
  -- Use email prefix as base, fallback to 'user'
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1),
    'user'
  );
  -- Append 4 chars of UUID to guarantee uniqueness across duplicate email prefixes
  -- e.g. two students named 'john' become 'john_a1b2' and 'john_c3d4'
  final_username := base_username || '_' || substring(replace(NEW.id::text, '-', ''), 1, 4);

  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', base_username),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Update updated_at timestamps
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Note: comments table removed from MVP schema. Trigger kept commented out.
-- Uncomment when comments feature is implemented.
-- CREATE TRIGGER set_comments_updated_at
--   BEFORE UPDATE ON public.comments
--   FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_tags_updated_at
  BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_project_versions_updated_at
  BEFORE UPDATE ON public.project_versions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_project_images_updated_at
  BEFORE UPDATE ON public.project_images
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Set submitted_at when status changes to pending
CREATE OR REPLACE FUNCTION public.handle_project_submitted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' AND OLD.status = 'draft' THEN
    NEW.submitted_at = NOW();
  END IF;
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    NEW.approved_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_project_status_change
  BEFORE UPDATE OF status ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_project_submitted();

-- 4. Sync upvote_count counter
CREATE OR REPLACE FUNCTION public.sync_upvote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.projects SET upvote_count = upvote_count + 1 WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.projects SET upvote_count = upvote_count - 1 WHERE id = OLD.project_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_upvote_change
  AFTER INSERT OR DELETE ON public.upvotes
  FOR EACH ROW EXECUTE FUNCTION public.sync_upvote_count();

-- 5. Sync bookmark_count counter
CREATE OR REPLACE FUNCTION public.sync_bookmark_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.projects SET bookmark_count = bookmark_count + 1 WHERE id = NEW.project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.projects SET bookmark_count = bookmark_count - 1 WHERE id = OLD.project_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_bookmark_change
  AFTER INSERT OR DELETE ON public.bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.sync_bookmark_count();

-- 6. Sync view_count from analytics_events
-- Fires when a 'view' event is logged so view_count stays accurate without querying analytics_events.
CREATE OR REPLACE FUNCTION public.sync_view_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type = 'view' THEN
    UPDATE public.projects SET view_count = view_count + 1 WHERE id = NEW.project_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_view_event
  AFTER INSERT ON public.analytics_events
  FOR EACH ROW EXECUTE FUNCTION public.sync_view_count();

-- Note: project_status_history trigger was removed.
-- Reason: used auth.uid() which returns NULL with service role Server Actions,
-- causing NOT NULL violations. Status change tracking is handled in application code.

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tags          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_versions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_images        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upvotes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags                  ENABLE ROW LEVEL SECURITY;

-- Helper: is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── PROFILES ──
CREATE POLICY "Profiles: public read"
  ON public.profiles FOR SELECT USING (TRUE);

CREATE POLICY "Profiles: own update"
  ON public.profiles FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Profiles: admin all"
  ON public.profiles FOR ALL USING (public.is_admin());

-- ── CATEGORIES (public read, admin write) ──
CREATE POLICY "Categories: public read"
  ON public.categories FOR SELECT USING (TRUE);

CREATE POLICY "Categories: admin write"
  ON public.categories FOR ALL USING (public.is_admin());

-- ── TAGS (public read, auth create) ──
CREATE POLICY "Tags: public read"
  ON public.tags FOR SELECT USING (TRUE);

CREATE POLICY "Tags: auth insert"
  ON public.tags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── PROJECTS ──
-- Public sees only approved, non-deleted projects.
-- Owners see all their own projects so they can manage them from the dashboard.
-- Admins see everything.
CREATE POLICY "Projects: approved public read"
  ON public.projects FOR SELECT
  USING (
    (status = 'approved' AND deleted_at IS NULL)
    OR user_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "Projects: own insert"
  ON public.projects FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Projects: own update"
  ON public.projects FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin());

-- No hard DELETE policy — soft delete by setting status = 'deleted' and deleted_at = NOW().
-- Physical deletion is intentionally not exposed to users or developers.
-- Admin-only hard delete can be done directly in Supabase dashboard if ever needed.

-- ── PROJECT TAGS ──
CREATE POLICY "ProjectTags: public read"
  ON public.project_tags FOR SELECT USING (TRUE);

CREATE POLICY "ProjectTags: owner write"
  ON public.project_tags FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
    OR public.is_admin()
  );

-- ── PROJECT IMAGES ──
CREATE POLICY "ProjectImages: public read"
  ON public.project_images FOR SELECT USING (TRUE);

CREATE POLICY "ProjectImages: owner write"
  ON public.project_images FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
    OR public.is_admin()
  );

-- ── PROJECT VERSIONS ──
CREATE POLICY "Versions: public read"
  ON public.project_versions FOR SELECT USING (TRUE);

CREATE POLICY "Versions: owner write"
  ON public.project_versions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
    OR public.is_admin()
  );

-- ── UPVOTES ──
CREATE POLICY "Upvotes: public read"
  ON public.upvotes FOR SELECT USING (TRUE);

CREATE POLICY "Upvotes: own insert"
  ON public.upvotes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Upvotes: own delete"
  ON public.upvotes FOR DELETE
  USING (user_id = auth.uid());

-- ── BOOKMARKS ──
CREATE POLICY "Bookmarks: own read"
  ON public.bookmarks FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Bookmarks: own insert"
  ON public.bookmarks FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Bookmarks: own delete"
  ON public.bookmarks FOR DELETE USING (user_id = auth.uid());

-- ── ANALYTICS EVENTS ──
CREATE POLICY "Analytics: owner read"
  ON public.analytics_events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Analytics: anyone insert"
  ON public.analytics_events FOR INSERT WITH CHECK (TRUE);

-- ── NOTIFICATIONS ──
CREATE POLICY "Notifications: own read"
  ON public.notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Notifications: own update (mark read)"
  ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- Notifications are only ever inserted by Server Actions using the service role,
-- which bypasses RLS. No client-side insert should ever be allowed.
-- Intentionally no INSERT policy here — blocks all direct client inserts.

-- ── REPORTS ──
CREATE POLICY "Reports: reporter read own"
  ON public.reports FOR SELECT USING (reporter_id = auth.uid() OR public.is_admin());

CREATE POLICY "Reports: auth insert"
  ON public.reports FOR INSERT WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Reports: admin update"
  ON public.reports FOR UPDATE USING (public.is_admin());

-- ── STATUS HISTORY ──
CREATE POLICY "StatusHistory: owner+admin read"
  ON public.project_status_history FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.user_id = auth.uid())
    OR public.is_admin()
  );

-- ── COMMENTS (removed from MVP) ──
-- Add comment table, RLS policies, and triggers when the feature is implemented.

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

-- Run in Supabase Dashboard → Storage → New Bucket
-- Or via SQL:

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('icons',           'icons',           TRUE,  2097152,  ARRAY['image/png','image/jpeg','image/webp']),
  ('project-images',  'project-images',  TRUE,  5242880,  ARRAY['image/png','image/jpeg','image/webp']),
  ('avatars',         'avatars',         TRUE,  2097152,  ARRAY['image/png','image/jpeg','image/webp']);

-- Storage RLS Policies

-- Icons: public read, owner write
CREATE POLICY "Icons: public read"
  ON storage.objects FOR SELECT USING (bucket_id = 'icons');

CREATE POLICY "Icons: auth upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'icons' AND auth.uid() IS NOT NULL);

CREATE POLICY "Icons: owner delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'icons' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

-- project-images: public read, owner write
CREATE POLICY "ProjectImages: public read"
  ON storage.objects FOR SELECT USING (bucket_id = 'project-images');

CREATE POLICY "ProjectImages: auth upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'project-images' AND auth.uid() IS NOT NULL);

-- Avatars: public read, owner write
CREATE POLICY "Avatars: public read"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Avatars: own upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

CREATE POLICY "Avatars: own delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
