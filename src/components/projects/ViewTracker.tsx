'use client'

import { useEffect } from 'react'
import { getOrCreateDeviceId, hasViewedProjectLocally, markProjectViewedLocally } from '@/lib/device'
import { recordProjectViewAction } from '@/app/actions/views'

interface Props {
  projectId: string
  deviceType: 'mobile' | 'tablet' | 'desktop'
}

/**
 * ViewTracker
 *
 * Enforces the AppFlix device-based view counting model:
 *   - At most 1 view per app per recognized browser/device identity, with no time limit.
 *   - Tier 1 (Client): If already marked viewed in localStorage, skips network request completely.
 *   - Tier 2 (Server Action): If not marked locally, calls atomic server action with persistent deviceId.
 *   - Error Handling: Only sets local viewed flag after receiving an explicit successful server confirmation.
 *     If a network error or server failure occurs, the local flag is NOT set, allowing retry on next visit.
 */
export default function ViewTracker({ projectId, deviceType }: Props) {
  useEffect(() => {
    async function trackView() {
      if (typeof window === 'undefined') return

      // Fast client-side deduplication check
      if (hasViewedProjectLocally(projectId)) {
        return
      }

      const deviceId = getOrCreateDeviceId()
      if (!deviceId) return

      // Responsive device classification
      let finalDeviceType: 'mobile' | 'tablet' | 'desktop' = deviceType
      const width = window.innerWidth
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      if (width < 768) {
        finalDeviceType = 'mobile'
      } else if (width >= 768 && width < 1024) {
        finalDeviceType = 'tablet'
      } else if (isTouch && width < 1366) {
        finalDeviceType = 'tablet'
      } else {
        finalDeviceType = 'desktop'
      }

      try {
        const res = await recordProjectViewAction(projectId, deviceId, finalDeviceType)
        // CRITICAL: Only mark as viewed locally if server explicitly succeeded!
        if (res && res.success === true) {
          markProjectViewedLocally(projectId)
        }
      } catch (err) {
        // Network drop or unexpected exception: DO NOT mark locally so view can be retried later
        console.error('[ViewTracker] Failed to record view (will retry on next visit):', err)
      }
    }

    trackView()
  }, [projectId, deviceType])

  return null
}
