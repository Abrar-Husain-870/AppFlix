'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function upvoteProject(projectId: string): Promise<{ success: boolean; upvoted: boolean; count: number }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const service = await createServiceRoleClient()

  // Check if already upvoted
  const { data: existing, error: selErr } = await service
    .from('upvotes')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (selErr) {
    console.error('[upvoteProject] check error:', selErr)
    throw new Error('Failed to verify upvote status')
  }

  let isUpvoted = false

  if (existing) {
    // Remove upvote
    const { error: delErr } = await service
      .from('upvotes')
      .delete()
      .eq('id', existing.id)

    if (delErr) {
      console.error('[upvoteProject] delete error:', delErr)
      throw new Error('Failed to remove upvote')
    }
    isUpvoted = false
  } else {
    // Add upvote
    const { error: insErr } = await service
      .from('upvotes')
      .insert({ project_id: projectId, user_id: user.id })

    if (insErr) {
      console.error('[upvoteProject] insert error:', insErr)
      throw new Error('Failed to add upvote')
    }

    // Log analytics event for trend tracking
    try {
      await service.from('analytics_events').insert({
        project_id: projectId,
        event_type: 'upvote',
        user_id: user.id,
      })
    } catch (e) {
      console.warn('[upvoteProject] analytics log failed:', e)
    }

    isUpvoted = true
  }

  // Fetch true updated project count from DB
  const { data: proj } = await service
    .from('projects')
    .select('upvote_count, slug')
    .eq('id', projectId)
    .single()

  const trueCount = proj?.upvote_count ?? 0

  revalidatePath('/browse')
  revalidatePath('/')
  revalidatePath('/bookmarks')
  if (proj?.slug) {
    revalidatePath(`/browse/${proj.slug}`, 'page')
  }

  return { success: true, upvoted: isUpvoted, count: trueCount }
}

export async function bookmarkProject(projectId: string): Promise<{ success: boolean; bookmarked: boolean }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const service = await createServiceRoleClient()

  const { data: existing, error: selErr } = await service
    .from('bookmarks')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (selErr) {
    console.error('[bookmarkProject] check error:', selErr)
    throw new Error('Failed to check bookmark')
  }

  let isBookmarked = false

  if (existing) {
    const { error: delErr } = await service.from('bookmarks').delete().eq('id', existing.id)
    if (delErr) {
      console.error('[bookmarkProject] delete error:', delErr)
      throw new Error('Failed to remove bookmark')
    }
    isBookmarked = false
  } else {
    const { error: insErr } = await service.from('bookmarks').insert({ project_id: projectId, user_id: user.id })
    if (insErr) {
      console.error('[bookmarkProject] insert error:', insErr)
      throw new Error('Failed to add bookmark')
    }
    isBookmarked = true
  }

  revalidatePath('/browse')
  revalidatePath('/bookmarks')

  return { success: true, bookmarked: isBookmarked }
}
