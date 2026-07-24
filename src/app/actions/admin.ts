'use server'

import { createServiceRoleClient, createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') throw new Error('Unauthorized')
  return user
}

export async function approveProject(projectId: string) {
  await assertAdmin()
  const supabase = await createServiceRoleClient()

  await supabase
    .from('projects')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', projectId)

  // Notify developer
  const { data: project } = await supabase
    .from('projects')
    .select('user_id')
    .eq('id', projectId)
    .single()

  if (project) {
    await supabase.from('notifications').insert({
      user_id: project.user_id,
      type: 'project_approved',
      project_id: projectId,
      message: 'Your project has been approved and is now live!',
    })
  }

  revalidatePath('/admin/queue')
  revalidatePath('/browse')
}

export async function rejectProject(projectId: string, reason: string) {
  await assertAdmin()
  const supabase = await createServiceRoleClient()

  await supabase
    .from('projects')
    .update({ status: 'rejected', rejection_reason: reason })
    .eq('id', projectId)

  const { data: project } = await supabase
    .from('projects')
    .select('user_id')
    .eq('id', projectId)
    .single()

  if (project) {
    await supabase.from('notifications').insert({
      user_id: project.user_id,
      type: 'project_rejected',
      project_id: projectId,
      message: `Your project was not approved. Reason: ${reason}`,
    })
  }

  revalidatePath('/admin/queue')
}
