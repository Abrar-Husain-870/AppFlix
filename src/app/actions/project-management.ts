'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ─── Delete ──────────────────────────────────────────────────────────────────
export async function deleteProject(projectId: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id, user_id, name')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) throw new Error('Project not found or you do not own this project')

  // Soft delete: set deleted_at and status to 'deleted'
  const { error } = await supabase
    .from('projects')
    .update({ deleted_at: new Date().toISOString(), status: 'deleted' })
    .eq('id', projectId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/dashboard/projects')
  revalidatePath('/browse')
}

// ─── Instant Text Edit (no re-approval needed) ───────────────────────────────
export async function updateProjectText(prevState: unknown, formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const projectId = formData.get('project_id') as string
  if (!projectId) return { error: 'Missing project ID' }

  // Verify ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id, user_id, status')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) return { error: 'Project not found or you do not own this project' }

  const name        = (formData.get('name') as string)?.trim()
  const tagline     = (formData.get('tagline') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()
  const categoryId  = formData.get('category_id') as string
  const stage       = formData.get('stage') as string
  const platforms   = formData.getAll('platforms') as string[]
  const isOpenSource = formData.get('is_open_source') === 'true'
  const isFree       = formData.get('is_free') === 'true'

  // Validation
  if (!name || name.length < 3 || name.length > 60)
    return { error: 'Project name must be 3–60 characters.' }
  if (!tagline || tagline.length < 10 || tagline.length > 120)
    return { error: 'Tagline must be 10–120 characters.' }
  if (!description || description.length < 50)
    return { error: 'Description must be at least 50 characters.' }
  if (!categoryId)
    return { error: 'Please select a category.' }
  if (!stage)
    return { error: 'Please select a stage.' }
  if (!platforms.length)
    return { error: 'Please select at least one platform.' }

  const { error } = await supabase
    .from('projects')
    .update({
      name,
      tagline,
      description,
      category_id: parseInt(categoryId),
      stage,
      platforms,
      is_open_source: isOpenSource,
      is_free: isFree,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/projects')
  revalidatePath(`/browse`)
  revalidatePath(`/browse/[slug]`, 'page')

  redirect('/dashboard/projects?updated=true')
}

// ─── Media/URL Edit (requires re-approval) ───────────────────────────────────
export async function updateProjectMedia(prevState: unknown, formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const projectId = formData.get('project_id') as string
  if (!projectId) return { error: 'Missing project ID' }

  // Verify ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id, user_id, status')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) return { error: 'Project not found or you do not own this project' }

  const iconUrl      = (formData.get('icon_url') as string)?.trim() || null
  const websiteUrl   = (formData.get('website_url') as string)?.trim() || null
  const githubUrl    = (formData.get('github_url') as string)?.trim() || null
  const appstoreUrl  = (formData.get('appstore_url') as string)?.trim() || null
  const playstoreUrl = (formData.get('playstore_url') as string)?.trim() || null
  const screenshotUrls = formData.getAll('screenshot_urls') as string[]

  // Build the media update payload — reset to pending for admin re-review
  const updatePayload: Record<string, unknown> = {
    status: 'pending',        // force re-approval
    updated_at: new Date().toISOString(),
  }
  if (iconUrl !== null)      updatePayload.icon_url      = iconUrl
  if (websiteUrl !== null)   updatePayload.website_url   = websiteUrl
  if (githubUrl !== null)    updatePayload.github_url    = githubUrl
  if (appstoreUrl !== null)  updatePayload.appstore_url  = appstoreUrl
  if (playstoreUrl !== null) updatePayload.playstore_url = playstoreUrl

  const { error } = await supabase
    .from('projects')
    .update(updatePayload)
    .eq('id', projectId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  // Update project_images table if screenshots changed
  if (screenshotUrls.length > 0) {
    // Remove old screenshots
    await supabase.from('project_images').delete().eq('project_id', projectId)
    // Insert new ones
    const imageRows = screenshotUrls.map((url, idx) => ({
      project_id: projectId,
      image_url: url,
      image_type: 'screenshot' as const,
      display_order: idx,
    }))
    await supabase.from('project_images').insert(imageRows)
  }

  revalidatePath('/dashboard/projects')
  revalidatePath('/browse')
  revalidatePath('/admin/queue')

  redirect('/dashboard/projects?media_updated=true')
}
