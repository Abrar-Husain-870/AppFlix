'use client'

import { useState, useEffect } from 'react'
import { bookmarkProject } from '@/app/actions/projects'
import { Bookmark } from 'lucide-react'

interface BookmarkButtonProps {
  projectId: string
  initialBookmarked: boolean
  requireAuth?: boolean
  variant?: 'compact' | 'desktop' | 'hero'
}

export default function BookmarkButton({
  projectId,
  initialBookmarked,
  requireAuth = false,
  variant = 'compact'
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [animating, setAnimating] = useState(false)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    setBookmarked(initialBookmarked)
  }, [initialBookmarked])

  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ projectId: string; bookmarked: boolean }>
      if (customEvent.detail?.projectId === projectId) {
        setBookmarked(customEvent.detail.bookmarked)
      }
    }
    window.addEventListener('appflix:bookmark-change', handleSync)
    return () => window.removeEventListener('appflix:bookmark-change', handleSync)
  }, [projectId])

  async function handleBookmark(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (requireAuth) {
      window.location.href = '/login'
      return
    }

    if (isPending) return

    const next = !bookmarked
    const prev = bookmarked
    setBookmarked(next)
    setAnimating(true)
    setIsPending(true)
    setTimeout(() => setAnimating(false), 300)

    try {
      const res = await bookmarkProject(projectId)
      if (res && res.success) {
        setBookmarked(res.bookmarked)
        window.dispatchEvent(
          new CustomEvent('appflix:bookmark-change', {
            detail: { projectId, bookmarked: res.bookmarked }
          })
        )
      }
    } catch {
      setBookmarked(prev)
    } finally {
      setIsPending(false)
    }
  }

  const isHero = variant === 'hero'
  const isDesktop = variant === 'desktop' || isHero
  const buttonId = isHero ? `bookmark-btn-hero-${projectId}` : isDesktop ? `bookmark-btn-desktop-${projectId}` : `bookmark-btn-${projectId}`

  return (
    <button
      id={buttonId}
      type="button"
      onClick={handleBookmark}
      disabled={isPending}
      aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark project'}
      title={bookmarked ? 'Remove bookmark' : 'Save for later'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.4rem',
        padding: isHero ? '0.55rem 0.75rem' : isDesktop ? '0.6rem 1rem' : '0',
        width: isDesktop ? '100%' : '38px',
        height: isDesktop ? 'auto' : '38px',
        flex: isHero ? 1 : 'none',
        background: isHero
          ? (bookmarked ? 'rgba(229,9,20,0.18)' : '#222226')
          : (bookmarked ? 'rgba(229,9,20,0.12)' : 'rgba(255,255,255,0.05)'),
        border: isHero
          ? `1px solid ${bookmarked ? 'rgba(229,9,20,0.5)' : 'rgba(255,255,255,0.08)'}`
          : `1px solid ${bookmarked ? 'rgba(229,9,20,0.4)' : '#2B2B2B'}`,
        borderRadius: '0.5rem',
        cursor: isPending ? 'wait' : 'pointer',
        transition: 'all 0.18s ease',
        transform: animating ? 'scale(1.08)' : 'scale(1)',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        if (isHero) {
          e.currentTarget.style.background = '#2E2E34'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
          return
        }
        if (!bookmarked && !isPending) {
          e.currentTarget.style.borderColor = 'rgba(229,9,20,0.4)'
          e.currentTarget.style.background = 'rgba(229,9,20,0.08)'
        }
      }}
      onMouseLeave={e => {
        if (isHero) {
          e.currentTarget.style.background = bookmarked ? 'rgba(229,9,20,0.18)' : '#222226'
          e.currentTarget.style.borderColor = bookmarked ? 'rgba(229,9,20,0.5)' : 'rgba(255,255,255,0.08)'
          return
        }
        if (!bookmarked && !isPending) {
          e.currentTarget.style.borderColor = '#2B2B2B'
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
        }
      }}
    >
      <Bookmark
        size={14}
        fill={bookmarked ? '#E50914' : 'none'}
        style={{ color: bookmarked ? '#E50914' : '#A1A1AA', transition: 'color 0.2s' }}
      />
      {isDesktop && (
        <span style={{
          fontSize: isHero ? '0.78rem' : '0.85rem',
          fontWeight: 600,
          color: bookmarked ? '#E50914' : '#D4D4D8',
          transition: 'color 0.2s',
          lineHeight: 1
        }}>
          {bookmarked ? 'Saved' : 'Bookmark'}
        </span>
      )}
    </button>
  )
}
