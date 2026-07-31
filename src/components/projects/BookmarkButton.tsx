'use client'

import { useState } from 'react'
import { bookmarkProject } from '@/app/actions/projects'
import { Bookmark } from 'lucide-react'

interface BookmarkButtonProps {
  projectId: string
  initialBookmarked: boolean
  requireAuth?: boolean
  variant?: 'compact' | 'desktop'
}

export default function BookmarkButton({
  projectId,
  initialBookmarked,
  requireAuth = false,
  variant = 'compact'
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [animating, setAnimating] = useState(false)

  async function handleBookmark() {
    if (requireAuth) {
      window.location.href = '/login'
      return
    }
    const next = !bookmarked
    setBookmarked(next)
    setAnimating(true)
    setTimeout(() => setAnimating(false), 300)
    try {
      await bookmarkProject(projectId)
    } catch {
      setBookmarked(!next)
    }
  }

  const isDesktop = variant === 'desktop'

  return (
    <button
      id={`bookmark-btn-${projectId}`}
      onClick={handleBookmark}
      aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark project'}
      title={bookmarked ? 'Remove bookmark' : 'Save for later'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.4rem',
        padding: isDesktop ? '0.6rem 1rem' : '0',
        width: isDesktop ? '100%' : '38px',
        height: isDesktop ? 'auto' : '38px',
        background: bookmarked ? 'rgba(229,9,20,0.12)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${bookmarked ? 'rgba(229,9,20,0.4)' : '#2B2B2B'}`,
        borderRadius: '0.5rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        transform: animating ? 'scale(1.15)' : 'scale(1)',
      }}
      onMouseEnter={e => {
        if (!bookmarked) {
          e.currentTarget.style.borderColor = 'rgba(229,9,20,0.4)'
          e.currentTarget.style.background = 'rgba(229,9,20,0.08)'
        }
      }}
      onMouseLeave={e => {
        if (!bookmarked) {
          e.currentTarget.style.borderColor = '#2B2B2B'
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
        }
      }}
    >
      <Bookmark
        size={14}
        fill={bookmarked ? '#E50914' : 'none'}
        style={{ color: bookmarked ? '#E50914' : '#AAAAAA', transition: 'color 0.2s' }}
      />
      {isDesktop && (
        <span style={{
          fontSize: '0.85rem',
          fontWeight: 600,
          color: bookmarked ? '#E50914' : '#FFFFFF',
          transition: 'color 0.2s',
          lineHeight: 1
        }}>
          {bookmarked ? 'Bookmarked' : 'Bookmark'}
        </span>
      )}
    </button>
  )
}
