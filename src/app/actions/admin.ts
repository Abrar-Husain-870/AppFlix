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

  // 1. Fetch project details
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('id, user_id, name')
    .eq('id', projectId)
    .single()

  if (projErr || !project) {
    throw new Error('Project not found')
  }

  // 2. Fetch profile to check free_listing_used entitlement
  const { data: profile } = await supabase
    .from('profiles')
    .select('free_listing_used')
    .eq('id', project.user_id)
    .single()

  const freeListingUsed = profile?.free_listing_used ?? false
  const now = new Date().toISOString()

  if (!freeListingUsed) {
    // A) First approved app -> permanent free listing
    await supabase
      .from('profiles')
      .update({ free_listing_used: true })
      .eq('id', project.user_id)

    await supabase
      .from('projects')
      .update({
        status: 'approved',
        approved_at: now,
        listing_type: 'free',
        listing_paid: true,
        listing_expires_at: null,
      })
      .eq('id', projectId)

    // Notify developer
    await supabase.from('notifications').insert({
      user_id: project.user_id,
      type: 'project_approved',
      title: 'Project Approved',
      project_id: projectId,
      message: 'Your project has been approved and is now live!',
    })
  } else {
    // B) Additional app -> check for reusable paid slot
    const { data: reusableSlots } = await supabase
      .from('listing_slots')
      .select('id, expires_at')
      .eq('user_id', project.user_id)
      .eq('status', 'paid')
      .gt('expires_at', now)
      .is('project_id', null)
      .order('expires_at', { ascending: true })
      .limit(1)

    const reusableSlot = reusableSlots && reusableSlots.length > 0 ? reusableSlots[0] : null

    if (reusableSlot) {
      // Assign reusable slot
      await supabase
        .from('listing_slots')
        .update({ project_id: projectId })
        .eq('id', reusableSlot.id)

      await supabase
        .from('projects')
        .update({
          status: 'approved',
          approved_at: now,
          listing_type: 'paid',
          listing_paid: true,
          listing_expires_at: reusableSlot.expires_at,
        })
        .eq('id', projectId)

      await supabase.from('notifications').insert({
        user_id: project.user_id,
        type: 'project_approved',
        title: 'Project Approved',
        project_id: projectId,
        message: 'Your project has been approved and is now live with your existing listing slot!',
      })
    } else {
      // Require payment (approved but unpaid until ₹79 payment confirmed)
      await supabase
        .from('projects')
        .update({
          status: 'approved',
          approved_at: now,
          listing_type: 'paid',
          listing_paid: false,
          listing_expires_at: null,
        })
        .eq('id', projectId)

      await supabase.from('notifications').insert({
        user_id: project.user_id,
        type: 'project_approved',
        title: 'Project Approved — Payment Required',
        project_id: projectId,
        message: 'Your project has been approved! Pay ₹79 for a 90-day listing to make it publicly visible.',
      })
    }
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
      title: 'Project Rejected',
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

  // Fetch project details first
  const { data: project } = await supabase
    .from('projects')
    .select('user_id, name, listing_type, listing_paid')
    .eq('id', projectId)
    .single()

  if (!project) throw new Error('Project not found')

  // If deleting a paid active app, release the listing slot for reuse
  if (project.listing_type === 'paid' && project.listing_paid) {
    const now = new Date().toISOString()
    await supabase
      .from('listing_slots')
      .update({ project_id: null })
      .eq('project_id', projectId)
      .eq('status', 'paid')
      .gt('expires_at', now)
  }

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
  await supabase.from('notifications').insert({
    user_id: project.user_id,
    type: 'project_rejected',
    title: 'Project Removed',
    project_id: projectId,
    message: `Your app "${project.name}" was removed by an admin. Reason: ${reason || 'Violation of platform guidelines'}`,
  })

  revalidatePath('/browse')
  revalidatePath('/dashboard/projects')
  revalidatePath('/admin/queue')
}


export async function getSupportInquiries() {
  await assertAdmin()
  const supabase = await createServiceRoleClient()

  const { data, error } = await supabase
    .from('support_inquiries')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getSupportInquiries error]:', error)
    return []
  }
  return data ?? []
}

export async function toggleInquiryStatus(inquiryId: string, currentStatus: string) {
  await assertAdmin()
  const supabase = await createServiceRoleClient()
  const newStatus = currentStatus === 'resolved' ? 'unread' : 'resolved'

  const { error } = await supabase
    .from('support_inquiries')
    .update({ status: newStatus })
    .eq('id', inquiryId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/inquiries')
}

export async function deleteInquiry(inquiryId: string) {
  await assertAdmin()
  const supabase = await createServiceRoleClient()

  const { error } = await supabase
    .from('support_inquiries')
    .delete()
    .eq('id', inquiryId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/inquiries')
}

export async function sendReplyToStudent(data: {
  inquiryId: string
  studentEmail: string
  subject: string
  replyMessage: string
}) {
  await assertAdmin()

  try {
    await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        access_key: '4b8c6628-9844-42b7-a3f2-efef88d928bb',
        to_email: data.studentEmail,
        from_name: 'AppFlix Support Team',
        subject: data.subject,
        message: data.replyMessage,
      }),
    })
  } catch (err) {
    console.error('Reply dispatch attempt:', err)
  }

  // Automatically mark inquiry as resolved
  const supabase = await createServiceRoleClient()
  await supabase
    .from('support_inquiries')
    .update({ status: 'resolved' })
    .eq('id', data.inquiryId)

  revalidatePath('/admin/inquiries')
  return { success: true }
}
