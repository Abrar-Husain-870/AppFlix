'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [isPending, setIsPending] = useState(false)

  // Sync state if props change (e.g. parent page refetches data)
  useEffect(() => {
    setOptimisticCount(initialCount)
  }, [initialCount])

  useEffect(() => {
    setOptimisticUpvoted(initialUpvoted)
  }, [initialUpvoted])

  // Sync across all buttons for this project on the same page (e.g. mobile & desktop buttons on details page)
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ projectId: string; upvoted: boolean; count: number }>
      if (customEvent.detail?.projectId === projectId) {
        setOptimisticUpvoted(customEvent.detail.upvoted)
        setOptimisticCount(customEvent.detail.count)
      }
    }

    window.addEventListener('appflix:upvote-change', handleSync)
    return () => window.removeEventListener('appflix:upvote-change', handleSync)
  }, [projectId])

  async function handleUpvote(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    if (requireAuth) {
      window.location.href = '/login'
      return
    }

    if (isPending) return

    const newUpvoted = !optimisticUpvoted
    const prevCount = optimisticCount
    const prevUpvoted = optimisticUpvoted

    // Optimistic UI update
    setOptimisticUpvoted(newUpvoted)
    setOptimisticCount(prev => newUpvoted ? prev + 1 : Math.max(0, prev - 1))
    setAnimating(true)
    setIsPending(true)
    setTimeout(() => setAnimating(false), 400)

    try {
      const res = await upvoteProject(projectId)
      if (res && res.success) {
        setOptimisticUpvoted(res.upvoted)
        setOptimisticCount(res.count)
        // Broadcast to all other instances of this project's upvote button on page
        window.dispatchEvent(
          new CustomEvent('appflix:upvote-change', {
            detail: { projectId, upvoted: res.upvoted, count: res.count }
          })
        )
      }
    } catch (err) {
      console.error('[UpvoteButton] failed:', err)
      // Rollback on failure
      setOptimisticUpvoted(prevUpvoted)
      setOptimisticCount(prevCount)
    } finally {
      setIsPending(false)
    }
  }

  const isDesktop = variant === 'desktop'
  const buttonId = isDesktop ? `upvote-btn-desktop-${projectId}` : `upvote-btn-${projectId}`

  return (
    <button
      id={buttonId}
      type="button"
      onClick={handleUpvote}
      disabled={isPending}
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
        cursor: isPending ? 'wait' : 'pointer',
        transition: 'all 0.2s',
        transform: animating ? 'scale(1.05)' : 'scale(1)',
        opacity: isPending ? 0.8 : 1,
      }}
      className={animating ? 'upvote-animate' : ''}
      onMouseEnter={e => {
        if (!optimisticUpvoted && !isPending) {
          e.currentTarget.style.borderColor = 'rgba(229,9,20,0.4)'
          e.currentTarget.style.background = 'rgba(229,9,20,0.08)'
        }
      }}
      onMouseLeave={e => {
        if (!optimisticUpvoted && !isPending) {
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
