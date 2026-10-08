-- ============================================================
-- APPFLIX: STORAGE BUCKET & RLS POLICIES FOR PROJECT SCREENSHOTS
-- ============================================================

-- 1. Ensure project-images bucket exists and is public with 10MB limit
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-images',
  'project-images',
  TRUE,
  10485760, -- 10MB
  ARRAY['image/png','image/jpeg','image/webp','image/jpg','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = TRUE,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png','image/jpeg','image/webp','image/jpg','image/gif'];

-- 2. Public read access
DROP POLICY IF EXISTS "ProjectImages: public read" ON storage.objects;
CREATE POLICY "ProjectImages: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-images');

-- 3. Authenticated upload access
DROP POLICY IF EXISTS "ProjectImages: auth upload" ON storage.objects;
CREATE POLICY "ProjectImages: auth upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'project-images' AND auth.uid() IS NOT NULL);

-- 4. Authenticated update (upsert) access
DROP POLICY IF EXISTS "ProjectImages: auth update" ON storage.objects;
CREATE POLICY "ProjectImages: auth update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'project-images' AND auth.uid() IS NOT NULL)
  WITH CHECK (bucket_id = 'project-images' AND auth.uid() IS NOT NULL);
