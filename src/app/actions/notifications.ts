'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface AppNotification {
  id: string
  user_id: string
  type: string
  title: string
  message: string | null
  link: string | null
  project_id: string | null
  is_read: boolean
  created_at: string
  updated_at: string
}

export interface CreateNotificationParams {
  userId: string
  type?: string
  title: string
  message: string
  link?: string
  projectId?: string
}

/**
 * Creates a notification safely using the service role client.
 * Falls back to 'system_notice' if type is not one of the default enum values.
 */
export async function createNotification({
  userId,
  type = 'system_notice',
  title,
  message,
  link,
  projectId,
}: CreateNotificationParams) {
  const supabaseService = await createServiceRoleClient()

  const safeType = ['project_approved', 'project_rejected', 'new_upvote', 'system_notice'].includes(type)
    ? type
    : 'system_notice'

  const { data, error } = await supabaseService
    .from('notifications')
    .insert({
      user_id: userId,
      type: safeType,
      title,
      message,
      link: link || null,
      project_id: projectId || null,
      is_read: false,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createNotification Error]:', error.message || error)
    return null
  }

  return data?.id
}

/**
 * Checks active paid listings for the user and generates milestones warnings
 * (15 days, 7 days, 3 days, 1 day, and Expired).
 * Deduplicates to ensure each milestone is generated at most once.
 */
async function checkAndDispatchExpiryWarnings(userId: string) {
  try {
    const supabaseService = await createServiceRoleClient()
    const now = new Date()

    // 1. Fetch user's paid approved projects
    const { data: projects } = await supabaseService
      .from('projects')
      .select('id, name, slug, listing_type, listing_paid, listing_expires_at')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .eq('listing_type', 'paid')
      .eq('listing_paid', true)
      .not('listing_expires_at', 'is', null)
      .is('deleted_at', null)

    if (!projects || projects.length === 0) return

    // 2. Fetch existing expiry notifications for these projects to prevent duplicates
    const projectIds = projects.map(p => p.id)
    const { data: existingNotifs } = await supabaseService
      .from('notifications')
      .select('id, project_id, title')
      .eq('user_id', userId)
      .in('project_id', projectIds)

    const existingTitlesByProject = new Map<string, Set<string>>()
    for (const notif of existingNotifs || []) {
      if (!notif.project_id) continue
      if (!existingTitlesByProject.has(notif.project_id)) {
        existingTitlesByProject.set(notif.project_id, new Set())
      }
      existingTitlesByProject.get(notif.project_id)!.add(notif.title)
    }

    for (const project of projects) {
      if (!project.listing_expires_at) continue
      const expiry = new Date(project.listing_expires_at)
      const diffMs = expiry.getTime() - now.getTime()
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      const existingTitles = existingTitlesByProject.get(project.id) || new Set<string>()

      let targetTitle = ''
      let targetMessage = ''

      if (daysLeft <= 0) {
        targetTitle = `⚠️ Listing Expired: ${project.name}`
        targetMessage = `Your listing for "${project.name}" has expired and is now unlisted. Your views, ratings, and stats are preserved. Renew now for ₹79 to restore visibility!`
      } else if (daysLeft <= 1) {
        targetTitle = `🚨 Only 1 Day Left! (${project.name})`
        targetMessage = `Don't keep your talent hidden! Tomorrow your app will become hidden from users. Take 30 seconds to renew for ₹79 and keep your hard work in the spotlight!`
      } else if (daysLeft <= 3) {
        targetTitle = `🔥 Hurry, Only 3 Days Left! (${project.name})`
        targetMessage = `Your listing for "${project.name}" will be unlisted very soon. Renew now for ₹79 to maintain your rank, stats, and discovery!`
      } else if (daysLeft <= 7) {
        targetTitle = `⏳ Only 7 Days Left! (${project.name})`
        targetMessage = `Don't let "${project.name}" disappear from the public browse directory. Renew for ₹79 to keep reaching new users.`
      } else if (daysLeft <= 15) {
        targetTitle = `⏰ 15 Days Remaining for "${project.name}"`
        targetMessage = `Keep your momentum going! Your 90-day store listing expires in 15 days. Renew early for ₹79 to ensure uninterrupted visibility.`
      }

      if (targetTitle && !existingTitles.has(targetTitle)) {
        await supabaseService.from('notifications').insert({
          user_id: userId,
          type: 'system_notice',
          title: targetTitle,
          message: targetMessage,
          link: '/dashboard/projects',
          project_id: project.id,
          is_read: false,
        })
      }
    }
  } catch (err) {
    console.error('[checkAndDispatchExpiryWarnings Exception]:', err)
  }
}

/**
 * Auto-prunes notifications older than 60 days to keep the free-tier database lean.
 */
async function autoPruneOldNotifications(userId: string) {
  try {
    const supabaseService = await createServiceRoleClient()
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()

    await supabaseService
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .lt('created_at', sixtyDaysAgo)
  } catch (err) {
    console.error('[autoPruneOldNotifications Exception]:', err)
  }
}

/**
 * Fetches notifications for the current authenticated user.
 * Automatically runs 60-day auto-pruning and expiry warning dispatches.
 */
export async function getUserNotifications(): Promise<{
  notifications: AppNotification[]
  unreadCount: number
}> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { notifications: [], unreadCount: 0 }
  }

  // 1. Auto-prune 60-day old notifications
  await autoPruneOldNotifications(user.id)

  // 2. Check and dispatch expiry warnings
  await checkAndDispatchExpiryWarnings(user.id)

  // 3. Fetch notifications
  const supabaseService = await createServiceRoleClient()
  const { data, error } = await supabaseService
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[getUserNotifications Error]:', error.message || error)
    return { notifications: [], unreadCount: 0 }
  }

  const notifications = (data || []) as AppNotification[]
  const unreadCount = notifications.filter(n => !n.is_read).length

  return { notifications, unreadCount }
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const supabaseService = await createServiceRoleClient()
  const { error } = await supabaseService
    .from('notifications')
    .update({
      is_read: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) {
    console.error('[markNotificationAsRead Error]:', error.message || error)
    return false
  }

  return true
}

/**
 * Marks all notifications for the current user as read.
 */
export async function markAllNotificationsAsRead(): Promise<boolean> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const supabaseService = await createServiceRoleClient()
  const { error } = await supabaseService
    .from('notifications')
    .update({
      is_read: true,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) {
    console.error('[markAllNotificationsAsRead Error]:', error.message || error)
    return false
  }

  return true
}

/**
 * Permanently deletes a notification from the database when dismissed with (✕).
 * Frees up database storage immediately for free-tier optimization.
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const supabaseService = await createServiceRoleClient()
  const { error } = await supabaseService
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) {
    console.error('[deleteNotification Error]:', error.message || error)
    return false
  }

  return true
}

/**
 * Permanently deletes all read notifications for the user to optimize storage.
 */
export async function deleteAllReadNotifications(): Promise<boolean> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const supabaseService = await createServiceRoleClient()
  const { error } = await supabaseService
    .from('notifications')
    .delete()
    .eq('user_id', user.id)
    .eq('is_read', true)

  if (error) {
    console.error('[deleteAllReadNotifications Error]:', error.message || error)
    return false
  }

  return true
}
