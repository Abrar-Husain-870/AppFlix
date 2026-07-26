'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { assertAdmin } from './admin'

export interface ReportItem {
  id: string
  project_id: string
  reporter_id: string
  reason: string
  details: string | null
  status: 'open' | 'developer_marked_fixed' | 'resolved' | 'dismissed' | string
  developer_response: string | null
  developer_responded_at: string | null
  created_at: string
  updated_at?: string
  projects?: {
    id: string
    name: string
    slug: string
    icon_url: string | null
    user_id: string
  } | null
  reporter_profile?: {
    username: string
  } | null
}

function parseReportDetails(rawDetails: string | null) {
  if (!rawDetails) return { reportReason: 'Reported Issue', developerResponse: null }
  const parts = rawDetails.split('\n\n💬 Developer Response: ')
  return {
    reportReason: parts[0] || 'Reported Issue',
    developerResponse: parts[1] || null,
  }
}

// ─── 1. Submit a Report (Public / Authenticated Users) ───────────────────────
const ENUM_REASON_MAP: Record<string, string> = {
  'spam': 'spam',
  'inappropriate': 'inappropriate',
  'broken_link': 'broken_link',
  'not_relevant': 'not_relevant',
  'duplicate': 'duplicate',
  'other': 'other',
}

export async function submitReport(projectId: string, reasonInput: string, customDetails?: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('You must be signed in to submit a report.')

  if (!projectId || !reasonInput) {
    throw new Error('Project ID and report reason are required.')
  }

  // Determine valid Postgres enum value & full label text
  let enumReason = 'other'
  let displayDetails = customDetails || reasonInput

  const lowerInput = reasonInput.toLowerCase()
  if (lowerInput.includes('spam')) {
    enumReason = 'spam'
  } else if (lowerInput.includes('inappropriate')) {
    enumReason = 'inappropriate'
  } else if (lowerInput.includes('broken')) {
    enumReason = 'broken_link'
  } else if (ENUM_REASON_MAP[lowerInput]) {
    enumReason = ENUM_REASON_MAP[lowerInput]
  } else {
    enumReason = 'other'
  }

  const supabaseService = await createServiceRoleClient()

  // Attempt insert into reports table
  const { data, error } = await supabaseService
    .from('reports')
    .insert({
      project_id: projectId,
      reporter_id: user.id,
      reason: enumReason,
      details: displayDetails,
      status: 'open',
    })
    .select('id')
    .single()

  if (error) {
    console.error('[submitReport Error]:', error)
    throw new Error(error.message || 'Failed to submit report.')
  }

  revalidatePath(`/browse`)
  revalidatePath(`/dashboard/projects`)
  revalidatePath(`/admin/reports`)
  return { success: true, reportId: data?.id }
}

// ─── 2. Fetch Active Reports for Developer Projects ─────────────────────────
export async function getDeveloperProjectReports(): Promise<ReportItem[]> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const supabaseService = await createServiceRoleClient()

  // First get all project IDs owned by user
  const { data: userProjects } = await supabaseService
    .from('projects')
    .select('id, name, slug, icon_url, user_id')
    .eq('user_id', user.id)

  if (!userProjects || userProjects.length === 0) return []

  const projectIds = userProjects.map(p => p.id)
  const projectMap = new Map(userProjects.map(p => [p.id, p]))

  const { data: reports, error } = await supabaseService
    .from('reports')
    .select('*')
    .in('project_id', projectIds)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getDeveloperProjectReports Error]:', error)
    return []
  }

  return (reports || []).map((r: any) => {
    const parsed = parseReportDetails(r.details)
    return {
      ...r,
      details: parsed.reportReason,
      developer_response: parsed.developerResponse || r.developer_response || null,
      projects: projectMap.get(r.project_id) || null,
    }
  })
}

// ─── 3. Developer Actions: Respond / Mark as Fixed ──────────────────────────
export async function developerUpdateReport(reportId: string, responseText?: string, markAsFixed?: boolean) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const supabaseService = await createServiceRoleClient()

  // Verify developer owns the reported project
  const { data: report } = await supabaseService
    .from('reports')
    .select('id, project_id, details, status')
    .eq('id', reportId)
    .single()

  if (!report) throw new Error('Report not found.')

  const { data: project } = await supabaseService
    .from('projects')
    .select('user_id')
    .eq('id', report.project_id)
    .single()

  if (!project || project.user_id !== user.id) {
    throw new Error('You can only manage reports for your own projects.')
  }

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }

  if (responseText !== undefined) {
    const rawDetails = report.details || ''
    const originalReason = rawDetails.split('\n\n💬 Developer Response: ')[0] || 'Reported Issue'
    const trimmedResp = responseText.trim()
    updates.details = trimmedResp ? `${originalReason}\n\n💬 Developer Response: ${trimmedResp}` : originalReason
  }

  if (markAsFixed) {
    updates.status = 'developer_marked_fixed'
  }

  const { error } = await supabaseService
    .from('reports')
    .update(updates)
    .eq('id', reportId)

  if (error) {
    console.error('[developerUpdateReport Error]:', error)
    throw new Error(error.message || 'Failed to update report.')
  }

  revalidatePath('/dashboard/projects')
  revalidatePath('/admin/reports')
  return { success: true }
}

// ─── 4. Admin Actions: Get Queue, Resolve, Dismiss ──────────────────────────
export async function getAdminReportsQueue(): Promise<ReportItem[]> {
  await assertAdmin()
  const supabaseService = await createServiceRoleClient()

  // 1. Fetch raw reports
  const { data: reports, error } = await supabaseService
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getAdminReportsQueue Error]:', error)
    return []
  }

  if (!reports || reports.length === 0) return []

  // 2. Fetch associated projects & reporter profiles
  const projectIds = Array.from(new Set(reports.map((r: any) => r.project_id).filter(Boolean)))
  const reporterIds = Array.from(new Set(reports.map((r: any) => r.reporter_id).filter(Boolean)))

  const [projectsRes, profilesRes] = await Promise.all([
    projectIds.length > 0
      ? supabaseService.from('projects').select('id, name, slug, icon_url, user_id').in('id', projectIds)
      : Promise.resolve({ data: [] }),
    reporterIds.length > 0
      ? supabaseService.from('profiles').select('id, username').in('id', reporterIds)
      : Promise.resolve({ data: [] }),
  ])

  const projectMap = new Map((projectsRes.data || []).map((p: any) => [p.id, p]))
  const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]))

  return reports.map((r: any) => {
    const parsed = parseReportDetails(r.details)
    return {
      ...r,
      details: parsed.reportReason,
      developer_response: parsed.developerResponse || r.developer_response || null,
      projects: projectMap.get(r.project_id) || null,
      reporter_profile: profileMap.get(r.reporter_id) || null,
    }
  })
}

export async function adminResolveReport(reportId: string) {
  await assertAdmin()
  const supabaseService = await createServiceRoleClient()

  const { error } = await supabaseService
    .from('reports')
    .update({
      status: 'actioned',
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/reports')
  revalidatePath('/dashboard/projects')
  return { success: true }
}

export async function adminDismissReport(reportId: string) {
  await assertAdmin()
  const supabaseService = await createServiceRoleClient()

  const { error } = await supabaseService
    .from('reports')
    .update({
      status: 'dismissed',
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/reports')
  revalidatePath('/dashboard/projects')
  return { success: true }
}
