'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function upvoteProject(projectId: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Check if already upvoted
  const { data: existing } = await supabase
    .from('upvotes')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    // Remove upvote
    await supabase.from('upvotes').delete().eq('id', existing.id)
  } else {
    // Add upvote
    await supabase.from('upvotes').insert({ project_id: projectId, user_id: user.id })
  }

  revalidatePath('/browse')
  revalidatePath(`/browse/[slug]`, 'page')
}

export async function bookmarkProject(projectId: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: existing } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    await supabase.from('bookmarks').delete().eq('id', existing.id)
  } else {
    await supabase.from('bookmarks').insert({ project_id: projectId, user_id: user.id })
  }

  revalidatePath('/browse')
}
