'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ProjectComment {
  id: string
  project_id: string
  user_id: string
  rating?: number
  headline: string
  comment: string
  created_at: string
  user_profile?: {
    username: string | null
    display_name: string | null
    avatar_url: string | null
  } | null
}

export async function submitComment(
  projectId: string,
  slug: string,
  headline: string,
  comment: string
) {
  const supabaseUser = await createServerClient()
  const supabaseService = await createServiceRoleClient()

  // 1. Must be logged in
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) {
    throw new Error('You must be signed in to leave a comment.')
  }

  // 2. Fetch project to check ownership (developers cannot comment on their own app)
  const { data: project } = await supabaseService
    .from('projects')
    .select('id, user_id')
    .eq('id', projectId)
    .single()

  if (!project) {
    throw new Error('Project not found.')
  }

  if (project.user_id === user.id) {
    throw new Error('As the developer of this app, you cannot leave a comment on your own project.')
  }

  // 3. Validation
  const cleanHeadline = headline.trim()
  const cleanComment = comment.trim()

  if (!cleanHeadline) {
    throw new Error('Please provide a short comment summary / tagline.')
  }
  if (!cleanComment) {
    throw new Error('Please provide your detailed comment.')
  }

  // 4. Insert comment into project_comments table
  const { error } = await supabaseService
    .from('project_comments')
    .insert({
      project_id: projectId,
      user_id: user.id,
      rating: 5,
      headline: cleanHeadline,
      comment: cleanComment,
    })

  if (error) {
    if (error.code === '42P01') {
      throw new Error('The comments table is currently being setup in database. Please run schema.sql in Supabase SQL Editor.')
    }
    throw new Error(error.message || 'Failed to submit comment.')
  }

  revalidatePath(`/browse/${slug}`)
  return { success: true }
}

export async function getProjectComments(projectId: string): Promise<ProjectComment[]> {
  try {
    const supabaseService = await createServiceRoleClient()

    const { data, error } = await supabaseService
      .from('project_comments')
      .select(`
        id, project_id, user_id, rating, headline, comment, created_at,
        profiles!user_id(username, display_name, avatar_url)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return (data as any[]).map(item => ({
      id: item.id,
      project_id: item.project_id,
      user_id: item.user_id,
      rating: item.rating,
      headline: item.headline,
      comment: item.comment,
      created_at: item.created_at,
      user_profile: item.profiles ? {
        username: item.profiles.username,
        display_name: item.profiles.display_name,
        avatar_url: item.profiles.avatar_url,
      } : null,
    }))
  } catch {
    return []
  }
}
