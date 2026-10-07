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

  // 1. Fetch project row first to check if this is an EDIT re-approval or a NEW submission
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('id, user_id, name, status, approved_at, listing_type, listing_paid, listing_expires_at')
    .eq('id', projectId)
    .single()

  if (projErr || !project) {
    throw new Error('Project not found')
  }

  const now = new Date().toISOString()
  const isEditSubmission = Boolean(project.approved_at)

  // 2. EDIT RE-APPROVAL PROTECTION:
  // If this project was ALREADY previously approved, preserve its active entitlement!
  if (isEditSubmission) {
    // ── CASE A: Previously approved as Lifetime Free listing ──
    if (project.listing_type === 'free' && project.listing_paid) {
      await supabase
        .from('projects')
        .update({
          status: 'approved',
          approved_at: now,
          listing_type: 'free',
          listing_paid: true,
          listing_expires_at: null,
          rejection_reason: null,
        })
        .eq('id', projectId)

      await supabase.from('notifications').insert({
        user_id: project.user_id,
        type: 'project_approved',
        title: 'Project Edits Approved',
        project_id: projectId,
        message: `Your edits for "${project.name}" have been approved and your app is live!`,
      })

      revalidatePath('/admin/queue')
      revalidatePath('/browse')
      revalidatePath(`/browse/${projectId}`)
      return
    }

    // ── CASE B: Previously approved as Paid listing with ACTIVE time remaining (e.g. 2 months left) ──
    const hasActivePaidListing =
      project.listing_type === 'paid' &&
      project.listing_paid &&
      project.listing_expires_at &&
      new Date(project.listing_expires_at) > new Date()

    if (hasActivePaidListing) {
      // PRESERVES EXACT EXPIRY DATE AND ALL REMAINING DAYS!
      await supabase
        .from('projects')
        .update({
          status: 'approved',
          approved_at: now,
          listing_type: 'paid',
          listing_paid: true,
          listing_expires_at: project.listing_expires_at,
          rejection_reason: null,
        })
        .eq('id', projectId)

      const expiryFormatted = new Date(project.listing_expires_at!).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })

      await supabase.from('notifications').insert({
        user_id: project.user_id,
        type: 'project_approved',
        title: 'Project Edits Approved',
        project_id: projectId,
        message: `Your edits for "${project.name}" have been approved! Your active listing remains live until ${expiryFormatted}.`,
      })

      revalidatePath('/admin/queue')
      revalidatePath('/browse')
      revalidatePath(`/browse/${projectId}`)
      return
    }

    // ── CASE C: Previously approved as Paid listing but EXPIRED ──
    // Check if user has an unused reusable listing slot available
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
      await supabase
        .from('listing_slots')
        .update({ project_id: projectId })
        .eq('id', reusableSlot.id)
        .is('project_id', null)

      await supabase
        .from('projects')
        .update({
          status: 'approved',
          approved_at: now,
          listing_type: 'paid',
          listing_paid: true,
          listing_expires_at: reusableSlot.expires_at,
          rejection_reason: null,
        })
        .eq('id', projectId)

      await supabase.from('notifications').insert({
        user_id: project.user_id,
        type: 'project_approved',
        title: 'Project Edits Approved',
        project_id: projectId,
        message: `Your edits for "${project.name}" have been approved and your app is live with your listing slot!`,
      })
    } else {
      // Keep in expired state requiring renewal fee
      await supabase
        .from('projects')
        .update({
          status: 'approved',
          approved_at: now,
          listing_type: 'paid',
          listing_paid: false,
          rejection_reason: null,
        })
        .eq('id', projectId)

      await supabase.from('notifications').insert({
        user_id: project.user_id,
        type: 'project_approved',
        title: 'Project Edits Approved — Renewal Due',
        project_id: projectId,
        message: `Your edits for "${project.name}" have been approved! Renew your listing for ₹79 to make it publicly visible.`,
      })
    }

    revalidatePath('/admin/queue')
    revalidatePath('/browse')
    revalidatePath(`/browse/${projectId}`)
    return
  }

  // 3. FIRST-TIME NEW SUBMISSION (Project never approved before)
  // Try executing via atomic database RPC
  const { data: rpcResult, error: rpcErr } = await supabase
    .rpc('approve_project_entitlement', { p_project_id: projectId })

  if (!rpcErr && rpcResult) {
    const resObj = typeof rpcResult === 'string' ? JSON.parse(rpcResult) : rpcResult
    const userId = resObj.user_id
    const resultType = resObj.result

    if (resultType === 'approved_free' || resultType === 'approved_existing_free') {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'project_approved',
        title: 'Project Approved',
        project_id: projectId,
        message: 'Your project has been approved and is now live!',
      })
    } else if (resultType === 'approved_existing_paid') {
      const expiryFormatted = resObj.expires_at
        ? new Date(resObj.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : null
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'project_approved',
        title: 'Project Approved',
        project_id: projectId,
        message: expiryFormatted
          ? `Your project edits have been approved! Your active listing remains live until ${expiryFormatted}.`
          : 'Your project edits have been approved and your active listing remains live!',
      })
    } else if (resultType === 'approved_reused_slot') {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'project_approved',
        title: 'Project Approved',
        project_id: projectId,
        message: 'Your project has been approved and is now live with your existing listing slot!',
      })
    } else {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'project_approved',
        title: 'Project Approved — Payment Required',
        project_id: projectId,
        message: 'Your project has been approved! Pay ₹79 for a 90-day listing to make it publicly visible.',
      })
    }

    revalidatePath('/admin/queue')
    revalidatePath('/browse')
    return
  }

  // Fallback for brand-new submission if RPC is not available in database
  // Attempt atomic claim of free entitlement using conditional .eq('free_listing_used', false)
  const { data: claimProfile } = await supabase
    .from('profiles')
    .update({ free_listing_used: true })
    .eq('id', project.user_id)
    .eq('free_listing_used', false)
    .select('id')

  if (claimProfile && claimProfile.length > 0) {
    // Successfully claimed free listing
    await supabase
      .from('projects')
      .update({
        status: 'approved',
        approved_at: now,
        listing_type: 'free',
        listing_paid: true,
        listing_expires_at: null,
        rejection_reason: null,
      })
      .eq('id', projectId)

    await supabase.from('notifications').insert({
      user_id: project.user_id,
      type: 'project_approved',
      title: 'Project Approved',
      project_id: projectId,
      message: 'Your project has been approved and is now live!',
    })
  } else {
    // Free entitlement already used -> check for active reusable paid slot
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

    let claimedSlot = null
    if (reusableSlot) {
      const { data: slotRes } = await supabase
        .from('listing_slots')
        .update({ project_id: projectId })
        .eq('id', reusableSlot.id)
        .is('project_id', null)
        .select('id, expires_at')

      if (slotRes && slotRes.length > 0) {
        claimedSlot = slotRes[0]
      }
    }

    if (claimedSlot) {
      await supabase
        .from('projects')
        .update({
          status: 'approved',
          approved_at: now,
          listing_type: 'paid',
          listing_paid: true,
          listing_expires_at: claimedSlot.expires_at,
          rejection_reason: null,
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
      await supabase
        .from('projects')
        .update({
          status: 'approved',
          approved_at: now,
          listing_type: 'paid',
          listing_paid: false,
          listing_expires_at: null,
          rejection_reason: null,
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

  // Close/action any active reports for the deleted app
  await supabase
    .from('reports')
    .update({
      status: 'actioned',
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('project_id', projectId)
    .neq('status', 'dismissed')

  revalidatePath('/browse')
  revalidatePath('/dashboard/projects')
  revalidatePath('/admin/queue')
  revalidatePath('/admin/reports')
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
