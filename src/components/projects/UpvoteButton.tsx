'use client'

import { useState } from 'react'
import { upvoteProject } from '@/app/actions/projects'
import { ArrowUp } from 'lucide-react'

interface UpvoteButtonProps {
  projectId: string
  initialCount: number
  initialUpvoted: boolean
  requireAuth?: boolean
  variant?: 'compact' | 'desktop'
}

export default function UpvoteButton({
  projectId,
  initialCount,
  initialUpvoted,
  requireAuth = false,
  variant = 'compact'
}: UpvoteButtonProps) {
  const [optimisticCount, setOptimisticCount] = useState(initialCount)
  const [optimisticUpvoted, setOptimisticUpvoted] = useState(initialUpvoted)
  const [animating, setAnimating] = useState(false)

  async function handleUpvote() {
    if (requireAuth) {
      window.location.href = '/login'
      return
    }

    const newUpvoted = !optimisticUpvoted
    setOptimisticUpvoted(newUpvoted)
    setOptimisticCount(prev => newUpvoted ? prev + 1 : prev - 1)
    setAnimating(true)
    setTimeout(() => setAnimating(false), 400)

    try {
      await upvoteProject(projectId)
    } catch {
      setOptimisticUpvoted(!newUpvoted)
      setOptimisticCount(prev => newUpvoted ? prev - 1 : prev + 1)
    }
  }

  const isDesktop = variant === 'desktop'

  return (
    <button
      id={`upvote-btn-${projectId}`}
      onClick={handleUpvote}
      aria-label={`${optimisticUpvoted ? 'Remove upvote from' : 'Upvote'} project`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.4rem',
        padding: isDesktop ? '0.6rem 1rem' : '0.45rem 0.85rem',
        width: isDesktop ? '100%' : 'auto',
        background: optimisticUpvoted ? 'rgba(229,9,20,0.15)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${optimisticUpvoted ? 'rgba(229,9,20,0.5)' : '#2B2B2B'}`,
        borderRadius: '0.5rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        transform: animating ? 'scale(1.05)' : 'scale(1)',
      }}
      className={animating ? 'upvote-animate' : ''}
      onMouseEnter={e => {
        if (!optimisticUpvoted) {
          e.currentTarget.style.borderColor = 'rgba(229,9,20,0.4)'
          e.currentTarget.style.background = 'rgba(229,9,20,0.08)'
        }
      }}
      onMouseLeave={e => {
        if (!optimisticUpvoted) {
          e.currentTarget.style.borderColor = '#2B2B2B'
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
        }
      }}
    >
      <ArrowUp
        size={14}
        strokeWidth={2.75}
        style={{ color: optimisticUpvoted ? '#E50914' : '#AAAAAA', transition: 'color 0.2s' }}
      />
      <span style={{
        fontSize: '0.85rem',
        fontWeight: 700,
        lineHeight: 1,
        color: optimisticUpvoted ? '#E50914' : '#FFFFFF',
        transition: 'color 0.2s',
      }}>
        {isDesktop ? (
          `${optimisticUpvoted ? 'Upvoted' : 'Upvote'} (${optimisticCount})`
        ) : (
          optimisticCount
        )}
      </span>
    </button>
  )
}
