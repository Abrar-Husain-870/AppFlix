'use server'

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

interface RecordViewResult {
  success: boolean
  counted: boolean
  view_count?: number
  error?: string
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/**
 * Server action to record a project view for a recognized device identity.
 *
 * Security & Abuse Controls:
 *   - Strictly validates projectId and deviceId against standard UUID v4 syntax.
 *   - Authenticates user session server-side from request cookies (never trusts client user identity).
 *   - Uses service_role client to invoke the restricted `record_project_view` RPC
 *     (which has direct execution revoked from public/anon/authenticated roles).
 */
export async function recordProjectViewAction(
  projectId: string,
  deviceId: string,
  deviceType?: 'mobile' | 'tablet' | 'desktop'
): Promise<RecordViewResult> {
  // 1. Strict Input Validation
  if (!projectId || typeof projectId !== 'string' || !UUID_REGEX.test(projectId.trim())) {
    return { success: false, counted: false, error: 'Invalid project ID format' }
  }

  if (!deviceId || typeof deviceId !== 'string' || !UUID_REGEX.test(deviceId.trim())) {
    return { success: false, counted: false, error: 'Invalid device ID format' }
  }

  const validDeviceTypes = ['mobile', 'tablet', 'desktop']
  const cleanDeviceType = deviceType && validDeviceTypes.includes(deviceType) ? deviceType : null

  try {
    // 2. Derive authenticated user on the server (if logged in)
    const userClient = await createServerClient()
    const { data: { user } } = await userClient.auth.getUser()
    const userId = user?.id ?? null

    // 3. Invoke restricted RPC via service role client
    const serviceClient = await createServiceRoleClient()
    const { data, error } = await serviceClient.rpc('record_project_view', {
      p_project_id: projectId.trim(),
      p_device_id: deviceId.trim(),
      p_device_type: cleanDeviceType,
      p_user_id: userId,
    })

    if (error) {
      console.error('[recordProjectViewAction] RPC execution failed:', error.message, error.code)
      return { success: false, counted: false, error: error.message }
    }

    return (data as RecordViewResult) ?? { success: true, counted: false }
  } catch (err: any) {
    console.error('[recordProjectViewAction] unexpected exception:', err)
    return { success: false, counted: false, error: err?.message || 'Internal server error' }
  }
}
