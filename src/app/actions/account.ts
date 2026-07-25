'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateProfile(prevState: unknown, formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const displayName    = (formData.get('display_name') as string)?.trim()
  const bio            = (formData.get('bio') as string)?.trim()
  const websiteUrl     = (formData.get('website_url') as string)?.trim() || null
  const twitterHandle  = (formData.get('twitter_handle') as string)?.trim().replace(/^@/, '') || null
  const githubUrl      = (formData.get('github_url') as string)?.trim() || null
  const linkedinUrl    = (formData.get('linkedin_url') as string)?.trim() || null
  const location       = (formData.get('location') as string)?.trim() || null
  const avatarUrl      = (formData.get('avatar_url') as string)?.trim() || null

  if (bio && bio.length > 300) return { error: 'Bio must be 300 characters or less.' }

  const update: Record<string, unknown> = {
    display_name: displayName || null,
    bio: bio || null,
    website_url: websiteUrl,
    twitter_handle: twitterHandle,
    github_url: githubUrl,
    linkedin_url: linkedinUrl,
    location,
    updated_at: new Date().toISOString(),
  }
  if (avatarUrl) update.avatar_url = avatarUrl

  const { error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/account')
  revalidatePath('/', 'layout')

  return { success: true }
}

export async function changePassword(prevState: unknown, formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const newPassword     = formData.get('new_password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!newPassword || newPassword.length < 8)
    return { error: 'Password must be at least 8 characters.' }
  if (newPassword !== confirmPassword)
    return { error: 'Passwords do not match.' }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: error.message }

  return { success: true }
}
