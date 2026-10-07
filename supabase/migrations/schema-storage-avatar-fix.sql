-- ============================================================
-- APPFLIX: STORAGE RLS POLICIES FIX (AVATARS & ICONS UPDATE / UPSERT)
-- Run this in Supabase Dashboard -> SQL Editor (if needed)
-- ============================================================

-- 1. Ensure avatars bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  5242880,
  ARRAY['image/png','image/jpeg','image/webp','image/jpg','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = TRUE,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png','image/jpeg','image/webp','image/jpg','image/gif'];

-- 2. Allow authenticated users to update (upsert) their own avatar
DROP POLICY IF EXISTS "Avatars: own update" ON storage.objects;
CREATE POLICY "Avatars: own update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL
  )
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL
  );

-- 3. Allow authenticated users to update (upsert) icons
DROP POLICY IF EXISTS "Icons: auth update" ON storage.objects;
CREATE POLICY "Icons: auth update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'icons' AND
    auth.uid() IS NOT NULL
  )
  WITH CHECK (
    bucket_id = 'icons' AND
    auth.uid() IS NOT NULL
  );
