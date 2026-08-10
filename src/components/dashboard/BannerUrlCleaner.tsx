'use client'

import { useEffect } from 'react'

/**
 * BannerUrlCleaner
 *
 * Cleanly removes transient query parameters (?submitted=true, ?updated=true, ?media_updated=true)
 * from the browser address bar after initial render using history.replaceState.
 * This prevents alert banners from persisting across page refreshes.
 */
export default function BannerUrlCleaner() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const url = new URL(window.location.href)
      let modified = false

      if (url.searchParams.has('submitted')) {
        url.searchParams.delete('submitted')
        modified = true
      }
      if (url.searchParams.has('updated')) {
        url.searchParams.delete('updated')
        modified = true
      }
      if (url.searchParams.has('media_updated')) {
        url.searchParams.delete('media_updated')
        modified = true
      }

      if (modified) {
        const cleanUrl = url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '')
        window.history.replaceState({}, '', cleanUrl)
      }
    }
  }, [])

  return null
}
