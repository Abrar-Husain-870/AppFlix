'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface ProjectComment {
  id: string
  project_id: string
  user_id: string
  headline: string
  comment: string
  created_at: string
  updated_at?: string
  developer_reply?: string | null
  developer_replied_at?: string | null
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

  // 3. Check if user has ALREADY commented on this app (1 comment per user limit)
  const { data: existingComment } = await supabaseService
    .from('project_comments')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single()

  if (existingComment) {
    throw new Error('You have already posted a comment on this app. You can edit your existing comment instead.')
  }

  // 4. Validation
  const cleanHeadline = headline.trim()
  const cleanComment = comment.trim()

  if (!cleanHeadline) {
    throw new Error('Please provide a short comment summary / tagline.')
  }
  if (!cleanComment) {
    throw new Error('Please provide your detailed comment.')
  }

  // 5. Insert comment
  const { error } = await supabaseService
    .from('project_comments')
    .insert({
      project_id: projectId,
      user_id: user.id,
      headline: cleanHeadline,
      comment: cleanComment,
    })

  if (error) {
    if (error.code === '42P01') {
      throw new Error('The comments table is currently being setup in database.')
    }
    throw new Error(error.message || 'Failed to submit comment.')
  }

  revalidatePath(`/browse/${slug}`)
  return { success: true }
}

export async function updateComment(
  commentId: string,
  projectId: string,
  slug: string,
  headline: string,
  comment: string
) {
  const supabaseUser = await createServerClient()
  const supabaseService = await createServiceRoleClient()

  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) {
    throw new Error('You must be signed in to edit your comment.')
  }

  const cleanHeadline = headline.trim()
  const cleanComment = comment.trim()

  if (!cleanHeadline) {
    throw new Error('Please provide a short comment summary / tagline.')
  }
  if (!cleanComment) {
    throw new Error('Please provide your detailed comment.')
  }

  const { error } = await supabaseService
    .from('project_comments')
    .update({
      headline: cleanHeadline,
      comment: cleanComment,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(error.message || 'Failed to update comment.')
  }

  revalidatePath(`/browse/${slug}`)
  return { success: true }
}

export async function deleteComment(
  commentId: string,
  projectId: string,
  slug: string
) {
  const supabaseUser = await createServerClient()
  const supabaseService = await createServiceRoleClient()

  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) {
    throw new Error('You must be signed in to delete your comment.')
  }

  // Check if admin or author
  const { data: profile } = await supabaseService
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  let query = supabaseService.from('project_comments').delete().eq('id', commentId)
  if (!isAdmin) {
    query = query.eq('user_id', user.id)
  }

  const { error } = await query

  if (error) {
    throw new Error(error.message || 'Failed to delete comment.')
  }

  revalidatePath(`/browse/${slug}`)
  return { success: true }
}

export async function replyToComment(
  commentId: string,
  projectId: string,
  slug: string,
  replyText: string
) {
  const supabaseUser = await createServerClient()
  const supabaseService = await createServiceRoleClient()

  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) {
    throw new Error('You must be signed in to reply to a comment.')
  }

  // Verify user is project owner or admin
  const [{ data: project }, { data: profile }] = await Promise.all([
    supabaseService.from('projects').select('id, user_id').eq('id', projectId).single(),
    supabaseService.from('profiles').select('role').eq('id', user.id).single(),
  ])

  const isOwner = project?.user_id === user.id
  const isAdmin = profile?.role === 'admin'

  if (!isOwner && !isAdmin) {
    throw new Error('Only the developer of this app can reply to user comments.')
  }

  const cleanReply = replyText.trim()
  if (!cleanReply) {
    throw new Error('Please enter a reply message.')
  }

  const { error } = await supabaseService
    .from('project_comments')
    .update({
      developer_reply: cleanReply,
      developer_replied_at: new Date().toISOString(),
    })
    .eq('id', commentId)

  if (error) {
    throw new Error(error.message || 'Failed to post reply.')
  }

  revalidatePath(`/browse/${slug}`)
  return { success: true }
}

export async function deleteDeveloperReply(
  commentId: string,
  projectId: string,
  slug: string
) {
  const supabaseUser = await createServerClient()
  const supabaseService = await createServiceRoleClient()

  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) {
    throw new Error('You must be signed in to delete a reply.')
  }

  const [{ data: project }, { data: profile }] = await Promise.all([
    supabaseService.from('projects').select('id, user_id').eq('id', projectId).single(),
    supabaseService.from('profiles').select('role').eq('id', user.id).single(),
  ])

  const isOwner = project?.user_id === user.id
  const isAdmin = profile?.role === 'admin'

  if (!isOwner && !isAdmin) {
    throw new Error('Only the developer of this app can delete this reply.')
  }

  const { error } = await supabaseService
    .from('project_comments')
    .update({
      developer_reply: null,
      developer_replied_at: null,
    })
    .eq('id', commentId)

  if (error) {
    throw new Error(error.message || 'Failed to delete reply.')
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
        id, project_id, user_id, headline, comment, created_at, updated_at,
        developer_reply, developer_replied_at,
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
      headline: item.headline,
      comment: item.comment,
      created_at: item.created_at,
      updated_at: item.updated_at,
      developer_reply: item.developer_reply,
      developer_replied_at: item.developer_replied_at,
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
