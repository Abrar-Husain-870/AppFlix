'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { upvoteProject } from '@/app/actions/projects'
import { ArrowUp } from 'lucide-react'
import { useState } from 'react'

interface UpvoteButtonProps {
  projectId: string
  initialCount: number
  initialUpvoted: boolean
  requireAuth?: boolean
}

export default function UpvoteButton({ projectId, initialCount, initialUpvoted, requireAuth = false }: UpvoteButtonProps) {
  const [optimisticCount, setOptimisticCount] = useState(initialCount)
  const [optimisticUpvoted, setOptimisticUpvoted] = useState(initialUpvoted)
  const [animating, setAnimating] = useState(false)

  async function handleUpvote() {
    if (requireAuth) {
      window.location.href = '/login'
      return
    }

    // Optimistic update
    const newUpvoted = !optimisticUpvoted
    setOptimisticUpvoted(newUpvoted)
    setOptimisticCount(prev => newUpvoted ? prev + 1 : prev - 1)
    setAnimating(true)
    setTimeout(() => setAnimating(false), 400)

    // Fire server action
    try {
      await upvoteProject(projectId)
    } catch {
      // Revert on failure
      setOptimisticUpvoted(!newUpvoted)
      setOptimisticCount(prev => newUpvoted ? prev - 1 : prev + 1)
    }
  }

  return (
    <button
      id={`upvote-btn-${projectId}`}
      onClick={handleUpvote}
      aria-label={`${optimisticUpvoted ? 'Remove upvote from' : 'Upvote'} project`}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: '0.4rem', padding: '0.45rem 0.85rem',
        background: optimisticUpvoted ? 'rgba(229,9,20,0.15)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${optimisticUpvoted ? 'rgba(229,9,20,0.5)' : '#2B2B2B'}`,
        borderRadius: '0.5rem', cursor: 'pointer',
        transition: 'all 0.2s',
        transform: animating ? 'scale(1.08)' : 'scale(1)',
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
      <span style={{
        fontSize: '0.85rem', fontWeight: 800, lineHeight: 1,
        color: optimisticUpvoted ? '#E50914' : '#FFFFFF',
        transition: 'color 0.2s',
      }}>
        {optimisticCount}
      </span>
      <ArrowUp
        size={16}
        strokeWidth={2.75}
        style={{ color: optimisticUpvoted ? '#E50914' : '#AAAAAA', transition: 'color 0.2s' }}
      />
    </button>
  )
}
