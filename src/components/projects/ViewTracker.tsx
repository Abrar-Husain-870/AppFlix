'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  projectId: string
  deviceType: 'mobile' | 'tablet' | 'desktop'
}

/**
 * Fires a single `view` analytics event per page load, client-side.
 * By running client-side we can read sessionStorage for a stable guest
 * visitor_id — fixing the bug where all anonymous server-side renders
 * were stored as visitor_id = 'server-render' (counting as 1 unique visitor).
 *
 * The `deviceType` is pre-computed server-side from the User-Agent header
 * and passed in as a prop — no client-side UA sniffing needed.
 *
 * Renders nothing visible.
 */
export default function ViewTracker({ projectId, deviceType }: Props) {
  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id ?? null

      // For guests: use a UUID in sessionStorage so each browser tab session
      // is counted as a distinct visitor (one new ID per tab, never crosses tabs).
      const visitorId = userId ? null : (() => {
        const key = 'appflix_visitor_id'
        let id = sessionStorage.getItem(key)
        if (!id) { id = crypto.randomUUID(); sessionStorage.setItem(key, id) }
        return id
      })()

      supabase.from('analytics_events').insert({
        project_id: projectId,
        event_type: 'view',
        user_id: userId,
        visitor_id: visitorId,
        device_type: deviceType,
      })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once on mount only

  return null
}
