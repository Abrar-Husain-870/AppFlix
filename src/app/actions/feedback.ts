'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from './notifications'

export interface ProjectFeedbackItem {
  id: string
  project_id: string
  user_id: string
  category: 'suggestion' | 'bug_report' | 'question' | 'general' | string
  message: string
  developer_reply: string | null
  developer_replied_at: string | null
  status: 'open' | 'replied' | 'closed' | string
  created_at: string
  updated_at: string
  user_profile?: {
    username: string | null
    display_name: string | null
    avatar_url: string | null
  } | null
  project?: {
    id: string
    name: string
    slug: string
  } | null
}

const CATEGORY_LABELS: Record<string, string> = {
  suggestion: '💡 Suggestion',
  bug_report: '🐛 Bug Report',
  question: '❓ Question',
  general: '💬 General Feedback',
}

/**
 * Automatically purges feedback threads older than 45 days to optimize Supabase free tier storage.
 */
async function autoPruneOldFeedback() {
  try {
    const supabaseService = await createServiceRoleClient()
    const cutoff = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    await supabaseService
      .from('project_feedback')
      .delete()
      .lt('created_at', cutoff)
  } catch (err) {
    // Graceful silent fail if table does not exist yet
  }
}

/**
 * Fetches the user's existing private feedback thread for a specific project.
 */
export async function getUserFeedbackForProject(projectId: string): Promise<ProjectFeedbackItem | null> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const supabaseService = await createServiceRoleClient()
  const { data, error } = await supabaseService
    .from('project_feedback')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !data) return null
  return data as ProjectFeedbackItem
}

/**
 * Submits or updates a private feedback thread for an app.
 * Capped at 500 characters and 1 thread per user per app to protect DB storage.
 */
export async function submitPrivateFeedback(
  projectId: string,
  category: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'You must be signed in to send private feedback.' }
  }

  const cleanMessage = message.trim().slice(0, 500)
  if (!cleanMessage) {
    return { success: false, error: 'Please enter your feedback message.' }
  }

  const validCategory = ['suggestion', 'bug_report', 'question', 'general'].includes(category)
    ? category
    : 'suggestion'

  const supabaseService = await createServiceRoleClient()

  // 1. Fetch project and owner
  const { data: project } = await supabaseService
    .from('projects')
    .select('id, name, slug, user_id')
    .eq('id', projectId)
    .single()

  if (!project) {
    return { success: false, error: 'Project not found.' }
  }

  if (project.user_id === user.id) {
    return { success: false, error: 'You cannot send private feedback to your own app.' }
  }

  // 2. Upsert single thread per user per project
  const now = new Date().toISOString()
  const { error: upsertErr } = await supabaseService
    .from('project_feedback')
    .upsert(
      {
        project_id: projectId,
        user_id: user.id,
        category: validCategory,
        message: cleanMessage,
        status: 'open',
        updated_at: now,
      },
      { onConflict: 'project_id,user_id' }
    )

  if (upsertErr) {
    if (upsertErr.code === '42P01') {
      return { success: false, error: 'The feedback database table is being initialized. Please run schema-project-feedback.sql in Supabase.' }
    }
    console.error('[submitPrivateFeedback Error]:', upsertErr)
    return { success: false, error: upsertErr.message || 'Failed to send feedback.' }
  }

  // 3. Dispatch in-app notification to the developer
  try {
    const { data: senderProfile } = await supabaseService
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    const senderName = senderProfile?.username || 'A user'
    const categoryLabel = CATEGORY_LABELS[validCategory] || 'Feedback'
    const snippet = cleanMessage.length > 70 ? cleanMessage.slice(0, 70) + '...' : cleanMessage

    await createNotification({
      userId: project.user_id,
      type: 'system_notice',
      title: `🔒 Private Feedback: "${project.name}"`,
      message: `@${senderName} sent ${categoryLabel}: "${snippet}"`,
      link: '/dashboard/projects',
      projectId: projectId,
    })
  } catch (notifErr) {
    console.error('[submitPrivateFeedback notification error]:', notifErr)
  }

  revalidatePath(`/browse/${project.slug}`)
  revalidatePath('/dashboard/projects')
  return { success: true }
}

/**
 * Developer replies to private feedback.
 */
export async function replyToPrivateFeedback(
  feedbackId: string,
  replyText: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized.' }
  }

  const cleanReply = replyText.trim().slice(0, 500)
  if (!cleanReply) {
    return { success: false, error: 'Reply text cannot be empty.' }
  }

  const supabaseService = await createServiceRoleClient()

  // 1. Fetch feedback and project
  const { data: feedback } = await supabaseService
    .from('project_feedback')
    .select('id, user_id, project_id, projects(id, name, slug, user_id)')
    .eq('id', feedbackId)
    .single()

  if (!feedback) {
    return { success: false, error: 'Feedback thread not found.' }
  }

  const proj = feedback.projects as any
  if (!proj || proj.user_id !== user.id) {
    return { success: false, error: 'Only the app developer can reply to private feedback.' }
  }

  const now = new Date().toISOString()
  const { error: updateErr } = await supabaseService
    .from('project_feedback')
    .update({
      developer_reply: cleanReply,
      developer_replied_at: now,
      status: 'replied',
      updated_at: now,
    })
    .eq('id', feedbackId)

  if (updateErr) {
    console.error('[replyToPrivateFeedback Error]:', updateErr)
    return { success: false, error: updateErr.message || 'Failed to save reply.' }
  }

  // 2. Dispatch notification to feedback author
  try {
    const snippet = cleanReply.length > 70 ? cleanReply.slice(0, 70) + '...' : cleanReply
    await createNotification({
      userId: feedback.user_id,
      type: 'system_notice',
      title: `🔒 Developer Replied: "${proj.name}"`,
      message: `The developer replied to your private feedback: "${snippet}"`,
      link: `/browse/${proj.slug}`,
      projectId: proj.id,
    })
  } catch (notifErr) {
    console.error('[replyToPrivateFeedback notification error]:', notifErr)
  }

  revalidatePath('/dashboard/projects')
  if (proj.slug) revalidatePath(`/browse/${proj.slug}`)
  return { success: true }
}

/**
 * Permanently deletes a feedback thread to immediately free database storage.
 * Callable by both the feedback sender and the app developer.
 */
export async function deletePrivateFeedback(feedbackId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized.' }
  }

  const supabaseService = await createServiceRoleClient()

  // Verify user is either sender or developer
  const { data: feedback } = await supabaseService
    .from('project_feedback')
    .select('id, user_id, project_id, projects(user_id)')
    .eq('id', feedbackId)
    .single()

  if (!feedback) {
    return { success: true } // Already gone
  }

  const isSender = feedback.user_id === user.id
  const isDev = (feedback.projects as any)?.user_id === user.id

  if (!isSender && !isDev) {
    return { success: false, error: 'Unauthorized to delete this feedback.' }
  }

  const { error: delErr } = await supabaseService
    .from('project_feedback')
    .delete()
    .eq('id', feedbackId)

  if (delErr) {
    console.error('[deletePrivateFeedback Error]:', delErr)
    return { success: false, error: delErr.message }
  }

  revalidatePath('/dashboard/projects')
  return { success: true }
}

/**
 * Fetches all feedback for projects owned by the authenticated developer.
 * Runs 45-day auto-pruning in the background.
 */
export async function getDeveloperProjectFeedback(): Promise<ProjectFeedbackItem[]> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Auto-prune old records first
  await autoPruneOldFeedback()

  const supabaseService = await createServiceRoleClient()

  // 1. Get developer's projects
  const { data: userProjects } = await supabaseService
    .from('projects')
    .select('id, name, slug')
    .eq('user_id', user.id)
    .is('deleted_at', null)

  if (!userProjects || userProjects.length === 0) return []

  const projectIds = userProjects.map(p => p.id)
  const projectMap = new Map(userProjects.map(p => [p.id, p]))

  // 2. Fetch feedback for those projects
  const { data: feedbackList, error } = await supabaseService
    .from('project_feedback')
    .select('*')
    .in('project_id', projectIds)
    .order('created_at', { ascending: false })

  if (error || !feedbackList) return []

  // 3. Fetch sender profiles
  const senderIds = Array.from(new Set(feedbackList.map(f => f.user_id)))
  const { data: profiles } = await supabaseService
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', senderIds)

  const profileMap = new Map((profiles || []).map(p => [p.id, p]))

  return feedbackList.map(f => ({
    ...f,
    project: projectMap.get(f.project_id) || null,
    user_profile: profileMap.get(f.user_id) || null,
  }))
}
