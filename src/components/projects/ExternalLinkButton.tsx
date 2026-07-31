'use client'

import { createClient } from '@/lib/supabase/client'
import type { ReactNode } from 'react'

interface Props {
  href: string
  projectId: string
  id?: string
  style?: React.CSSProperties
  children: ReactNode
}

/**
 * A generic tracked external link.
 * Fires a `click_external` analytics event (fire-and-forget) on every click
 * before the browser navigates to the external URL.
 *
 * Works for: Visit Site, GitHub, App Store, Play Store — any outbound link.
 *
 * Guest visitor identification uses sessionStorage (per browser tab) so each
 * anonymous session counts as a distinct visitor without touching the database
 * or fingerprinting the user.
 */
export default function ExternalLinkButton({ href, projectId, id, style, children }: Props) {
  function handleClick() {
    const supabase = createClient()
    // Fire-and-forget: don't await — navigation must not be blocked
    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id ?? null
      // For guests: use a UUID persisted in sessionStorage (one per tab session)
      const visitorId = userId ? null : (() => {
        const key = 'appflix_visitor_id'
        let id = sessionStorage.getItem(key)
        if (!id) { id = crypto.randomUUID(); sessionStorage.setItem(key, id) }
        return id
      })()

      supabase.from('analytics_events').insert({
        project_id: projectId,
        event_type: 'click_external',
        user_id: userId,
        visitor_id: visitorId,
      })
    })
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      id={id}
      onClick={handleClick}
      style={style}
    >
      {children}
    </a>
  )
}
