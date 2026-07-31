'use server'

import { createServerClient } from '@/lib/supabase/server'
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

  revalidatePath('/dashboard/projects')
  redirect('/dashboard/projects?submitted=true')
}
