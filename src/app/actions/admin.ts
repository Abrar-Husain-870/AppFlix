'use server'

import { createServiceRoleClient, createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function assertAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('[assertAdmin] No user found in session')
    throw new Error('Unauthenticated')
  }
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  console.log('[assertAdmin] User:', user.email, 'Role:', profile?.role, 'Error:', error)
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

export async function getPendingProjects() {
  await assertAdmin()
  const supabase = await createServiceRoleClient()

  const { data, error } = await supabase
    .from('projects')
    .select(`
      id, name, slug, tagline, description, icon_url,
      website_url, github_url, stage, platforms, created_at, approved_at, updated_at,
      categories(name), profiles!user_id(username)
    `)
    .eq('status', 'pending')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[getPendingProjects error]:', error)
    return []
  }
  return (data as any[]) ?? []
}

export async function adminDeleteProject(projectId: string, reason?: string) {
  await assertAdmin()
  const supabase = await createServiceRoleClient()

  const { error } = await supabase
    .from('projects')
    .update({
      deleted_at: new Date().toISOString(),
      status: 'deleted',
      rejection_reason: reason || 'Removed by admin',
    })
    .eq('id', projectId)

  if (error) throw new Error(error.message)

  // Notify developer
  const { data: project } = await supabase
    .from('projects')
    .select('user_id, name')
    .eq('id', projectId)
    .single()

  if (project) {
    await supabase.from('notifications').insert({
      user_id: project.user_id,
      type: 'project_rejected',
      project_id: projectId,
      message: `Your app "${project.name}" was removed by an admin. Reason: ${reason || 'Violation of platform guidelines'}`,
    })
  }

  revalidatePath('/browse')
  revalidatePath('/dashboard/projects')
  revalidatePath('/admin/queue')
}
