'use client'

import { useState } from 'react'
import { bookmarkProject } from '@/app/actions/projects'
import { Bookmark } from 'lucide-react'

interface BookmarkButtonProps {
  projectId: string
  initialBookmarked: boolean
  requireAuth?: boolean
}

export default function BookmarkButton({ projectId, initialBookmarked, requireAuth = false }: BookmarkButtonProps) {
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

  return (
    <button
      id={`bookmark-btn-${projectId}`}
      onClick={handleBookmark}
      aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark project'}
      title={bookmarked ? 'Remove bookmark' : 'Save for later'}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '38px', height: '38px',
        background: bookmarked ? 'rgba(229,9,20,0.12)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${bookmarked ? 'rgba(229,9,20,0.4)' : '#2B2B2B'}`,
        borderRadius: '0.5rem', cursor: 'pointer',
        transition: 'all 0.2s',
        transform: animating ? 'scale(1.2)' : 'scale(1)',
      }}
    >
      <Bookmark
        size={16}
        fill={bookmarked ? '#E50914' : 'none'}
        style={{ color: bookmarked ? '#E50914' : '#AAAAAA', transition: 'color 0.2s' }}
      />
    </button>
  )
}
