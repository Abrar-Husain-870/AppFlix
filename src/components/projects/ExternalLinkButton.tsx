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
 * Fires a `click_external` analytics event on every click before navigating.
 *
 * The DB has a strict XOR constraint:
 *   - If user is logged in  → user_id = UUID,   visitor_id = NULL
 *   - If user is a guest    → user_id = NULL,    visitor_id = UUID (from sessionStorage)
 * Both must never be null/both simultaneously or the INSERT is rejected.
 *
 * target="_blank" opens a new tab so this page stays open — the async
 * insert has time to complete before anything unloads.
 */
export default function ExternalLinkButton({ href, projectId, id, style, children }: Props) {
  async function handleClick() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const userId    = user?.id ?? null
      const visitorId = userId
        ? null
        : (() => {
            const KEY = 'appflix_visitor_id'
            let vid = sessionStorage.getItem(KEY)
            if (!vid) { vid = crypto.randomUUID(); sessionStorage.setItem(KEY, vid) }
            return vid
          })()

      // Sanity check: XOR must hold before we even try
      if ((userId === null) === (visitorId === null)) {
        console.warn('[ExternalLinkButton] XOR violated — skipping insert', { userId, visitorId })
        return
      }

      const { error } = await supabase.from('analytics_events').insert({
        project_id:  projectId,
        event_type:  'click_external',
        user_id:     userId,
        visitor_id:  visitorId,
      })

      if (error) {
        console.error('[ExternalLinkButton] insert failed:', error.message, error.code, { userId, visitorId, projectId })
      }
    } catch (err) {
      console.error('[ExternalLinkButton] unexpected error:', err)
    }
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
