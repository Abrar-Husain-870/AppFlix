import { createServerClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import EditProjectClient from './EditProjectClient'

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params

  // Fetch core project fields (no nested join to avoid RLS issues)
  const { data: project } = await supabase
    .from('projects')
    .select(
      'id, name, slug, tagline, description, category_id, stage, platforms, is_open_source, is_free, icon_url, website_url, github_url, appstore_url, playstore_url, status'
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!project) notFound()

  // Fetch screenshots separately (column is image_url, not url)
  const { data: images } = await supabase
    .from('project_images')
    .select('image_url, display_order')
    .eq('project_id', id)
    .eq('image_type', 'screenshot')
    .order('display_order', { ascending: true })

  return (
    <EditProjectClient
      project={{
        ...project,
        project_images: (images ?? []).map(img => ({
          url: img.image_url,
          display_order: img.display_order,
        })),
      }}
    />
  )
}
