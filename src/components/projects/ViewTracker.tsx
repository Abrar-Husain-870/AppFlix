'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  projectId: string
  deviceType: 'mobile' | 'tablet' | 'desktop'
}

/**
 * Fires a single `view` analytics event per page load, client-side.
 *
 * Why client-side:
 *   Server-side inserts can't read sessionStorage, so all anonymous views
 *   would share visitor_id = 'server-render' (every guest counted as 1 unique
 *   visitor). Running client-side gives each browser tab its own UUID.
 *
 * XOR constraint (DB enforced):
 *   - Logged-in users  → user_id = UUID,  visitor_id = NULL
 *   - Guest visitors   → user_id = NULL,  visitor_id = UUID (sessionStorage)
 *
 * deviceType is pre-detected server-side from User-Agent and passed as a prop,
 * but overridden on the client using exact screen width for 100% accuracy.
 */
export default function ViewTracker({ projectId, deviceType }: Props) {
  useEffect(() => {
    async function recordView() {
      try {
        const supabase = createClient()

        // Always await getUser so we know for sure if the session is loaded
        const { data: { user } } = await supabase.auth.getUser()

        const userId = user?.id ?? null

        // Guests get a stable UUID per browser tab from sessionStorage
        const visitorId = userId
          ? null
          : (() => {
              const KEY = 'appflix_visitor_id'
              let vid = sessionStorage.getItem(KEY)
              if (!vid) { vid = crypto.randomUUID(); sessionStorage.setItem(KEY, vid) }
              return vid
            })()

        // Guard: XOR must hold — exactly one identifier must be set
        if ((userId === null) === (visitorId === null)) {
          console.warn('[ViewTracker] XOR violated — skipping insert', { userId, visitorId })
          return
        }

        // Determine exact device type based on actual screen size (un-spoofable)
        let finalDeviceType: 'mobile' | 'tablet' | 'desktop' = deviceType
        if (typeof window !== 'undefined') {
          const width = window.innerWidth
          const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
          
          if (width < 768) {
            finalDeviceType = 'mobile'
          } else if (width >= 768 && width < 1024) {
            finalDeviceType = 'tablet'
          } else if (isTouch && width < 1366) {
            // iPad Pro or large tablets
            finalDeviceType = 'tablet'
          } else {
            finalDeviceType = 'desktop'
          }
        }

        const { error } = await supabase.from('analytics_events').insert({
          project_id:  projectId,
          event_type:  'view',
          user_id:     userId,
          visitor_id:  visitorId,
          device_type: finalDeviceType,
        })

        if (error) {
          console.error('[ViewTracker] insert failed:', error.message, error.code, { userId, visitorId, projectId })
        }
      } catch (err) {
        console.error('[ViewTracker] unexpected error:', err)
      }
    }

    recordView()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on mount only

  return null
}
