'use client'

import { useSyncExternalStore } from 'react'
import type { CardViewMode } from '@/components/ui/ViewModeToggle'

export const CARD_VIEW_MODE_STORAGE_KEY = 'appflix_card_view_mode'
export const CARD_VIEW_MODE_EVENT = 'appflix:card-view-mode-change'

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {}

  const handleCustomEvent = (e: Event) => {
    callback()
  }

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === CARD_VIEW_MODE_STORAGE_KEY) {
      callback()
    }
  }

  window.addEventListener(CARD_VIEW_MODE_EVENT, handleCustomEvent)
  window.addEventListener('storage', handleStorageEvent)

  return () => {
    window.removeEventListener(CARD_VIEW_MODE_EVENT, handleCustomEvent)
    window.removeEventListener('storage', handleStorageEvent)
  }
}

function getSnapshot(): CardViewMode {
  if (typeof window === 'undefined') return 'grid'
  try {
    const stored = localStorage.getItem(CARD_VIEW_MODE_STORAGE_KEY)
    if (stored === 'pill' || stored === 'grid') {
      return stored
    }
  } catch {
    // Fallback if localStorage is inaccessible
  }
  return 'grid'
}

function getServerSnapshot(): CardViewMode {
  return 'grid'
}

/**
 * Hook to read and update the user's app card view preference ('grid' | 'pill').
 * Persists to browser localStorage and synchronizes across all components and browser tabs in real-time.
 */
export function useCardViewMode(): [CardViewMode, (mode: CardViewMode) => void] {
  const viewMode = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  const setViewMode = (mode: CardViewMode) => {
    if (mode !== 'pill' && mode !== 'grid') return
    try {
      localStorage.setItem(CARD_VIEW_MODE_STORAGE_KEY, mode)
    } catch {
      // Ignore write errors (e.g. private mode quota)
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(CARD_VIEW_MODE_EVENT, { detail: { mode } })
      )
    }
  }

  return [viewMode, setViewMode]
}
