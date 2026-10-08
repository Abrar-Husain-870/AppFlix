'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export type SubmitState = {
  error?: string
  fieldErrors?: Record<string, string>
  success?: boolean
} | undefined

export async function submitProject(state: SubmitState, formData: FormData): Promise<SubmitState> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to submit a project.' }

  // Extract fields
  const name        = (formData.get('name') as string)?.trim()
  const tagline     = (formData.get('tagline') as string)?.trim()
  const description = (formData.get('description') as string)?.trim()
  const categoryId  = formData.get('category_id') as string
  const stage       = formData.get('stage') as string
  const websiteUrl    = (formData.get('website_url') as string)?.trim() || null
  const githubUrl     = (formData.get('github_url') as string)?.trim() || null
  const appstoreUrl   = (formData.get('appstore_url') as string)?.trim() || null
  const playstoreUrl  = (formData.get('playstore_url') as string)?.trim() || null
  const iconUrl     = (formData.get('icon_url') as string)?.trim() || null
  const platformsRaw = formData.getAll('platforms') as string[]
  const tagsRaw      = formData.getAll('tags') as string[]

  const screenshotUrls = (formData.getAll('screenshot_urls') as string[]).filter(Boolean)

  // Validation
  const errors: Record<string, string> = {}
  if (!name || name.length < 3)          errors.name = 'Name must be at least 3 characters.'
  if (!tagline || tagline.length < 10)   errors.tagline = 'Tagline must be at least 10 characters.'
  if (!description || description.length < 50) errors.description = 'Description must be at least 50 characters.'
  if (!categoryId)                        errors.category_id = 'Please select a category.'
  if (!stage)                             errors.stage = 'Please select a project stage.'
  if (platformsRaw.length === 0)          errors.platforms = 'Select at least one platform.'
  if (!websiteUrl && !githubUrl && !appstoreUrl && !playstoreUrl)
    errors.links = 'Please provide at least one link (Website, GitHub, App Store, or Play Store).'
  if (tagsRaw.length > 5)
    errors.tags = 'You can select up to 5 tags only.'

  if (Object.keys(errors).length > 0) return { fieldErrors: errors }

  // Generate slug from name
  const slug = name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    + '-' + Date.now().toString(36)

  // Insert project
  const { data: project, error: insertError } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name,
      slug,
      tagline,
      description,
      category_id: parseInt(categoryId),
      stage,
      platforms: platformsRaw,
      website_url:   websiteUrl,
      github_url:    githubUrl,
      appstore_url:  appstoreUrl,
      playstore_url: playstoreUrl,
      icon_url: iconUrl,
      status: 'pending',
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('[submitProject]', insertError)
    return { error: `Submission failed: ${insertError.message}` }
  }

  // Insert screenshots
  if (screenshotUrls.length > 0 && project) {
    await supabase.from('project_images').insert(
      screenshotUrls.map((url, i) => ({
        project_id: project.id,
        image_url: url,
        image_type: 'screenshot',
        display_order: i + 1,
      }))
    )
  }

  // Insert project tags
  if (tagsRaw.length > 0 && project) {
    const { data: dbTags } = await supabase
      .from('tags')
      .select('id, name')
      .in('name', tagsRaw)
    
    if (dbTags && dbTags.length > 0) {
      await supabase.from('project_tags').insert(
        dbTags.map(t => ({
          project_id: project.id,
          tag_id: t.id
        }))
      )
    }
  }

  revalidatePath('/dashboard/projects')
  redirect('/dashboard/projects?submitted=true')
}

export async function uploadScreenshotAction(
  formData: FormData,
  accessToken?: string
): Promise<{ url?: string; error?: string }> {
  try {
    let user = null
    const storageClient = await createServiceRoleClient()

    if (accessToken) {
      try {
        const { data, error } = await storageClient.auth.getUser(accessToken)
        if (!error && data?.user) {
          user = data.user
        }
      } catch (authErr) {
        console.warn('[uploadScreenshotAction] Bearer token validation error:', authErr)
      }
    }

    if (!user) {
      try {
        const supabase = await createServerClient()
        const { data: { user: cookieUser } } = await supabase.auth.getUser()
        user = cookieUser
      } catch (cookieErr) {
        console.warn('[uploadScreenshotAction] Cookie auth check error:', cookieErr)
      }
    }

    if (!user) {
      return { error: 'You must be signed in to upload screenshots.' }
    }

    const file = formData.get('file') as File | null
    if (!file) {
      return { error: 'No screenshot file provided.' }
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split('.').pop() || 'png'
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const filePath = `${user.id}/screenshot-${Date.now()}-${randomSuffix}.${ext}`

    const { error: uploadError } = await storageClient.storage
      .from('project-images')
      .upload(filePath, inputBuffer, {
        contentType: file.type || 'image/png',
        upsert: true,
      })

    if (uploadError) {
      console.error('[uploadScreenshotAction] Storage upload error:', uploadError)
      return { error: uploadError.message }
    }

    const { data: urlData } = storageClient.storage
      .from('project-images')
      .getPublicUrl(filePath)

    return { url: urlData.publicUrl }
  } catch (err: any) {
    console.error('[uploadScreenshotAction] Unexpected error:', err)
    return { error: err?.message || 'Failed to upload screenshot.' }
  }
}

