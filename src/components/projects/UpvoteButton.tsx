'use client'

import { useState, useEffect, useRef } from 'react'
import { upvoteProject } from '@/app/actions/projects'
import { ArrowUp } from 'lucide-react'

interface UpvoteButtonProps {
  projectId: string
  initialCount: number
  initialUpvoted: boolean
  requireAuth?: boolean
  variant?: 'compact' | 'desktop' | 'hero'
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

  const [isHovered, setIsHovered] = useState(false)

  const isHero = variant === 'hero'
  const isDesktop = variant === 'desktop' || isHero
  const buttonId = isHero ? `upvote-btn-hero-${projectId}` : isDesktop ? `upvote-btn-desktop-${projectId}` : `upvote-btn-${projectId}`

  // Match the browse page theme:
  // - Unvoted: white/grey (dark background, #2B2B2B border, grey arrow, white text)
  // - Upvoted: red theme (translucent red background, red border, red arrow, red text)
  const bg = optimisticUpvoted
    ? (isHovered ? 'rgba(229, 9, 20, 0.22)' : 'rgba(229, 9, 20, 0.15)')
    : (isHovered ? 'rgba(255, 255, 255, 0.10)' : isHero ? '#1F1F24' : 'rgba(255, 255, 255, 0.05)')

  const border = optimisticUpvoted
    ? (isHovered ? '1px solid #E50914' : '1px solid rgba(229, 9, 20, 0.55)')
    : (isHovered ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid #2B2B2B')

  const arrowColor = optimisticUpvoted ? '#E50914' : isHovered ? '#FFFFFF' : '#AAAAAA'
  const textColor = optimisticUpvoted ? '#E50914' : '#FFFFFF'

  return (
    <button
      id={buttonId}
      type="button"
      onClick={handleUpvote}
      disabled={isPending}
      aria-label={`${optimisticUpvoted ? 'Remove upvote from' : 'Upvote'} project`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.45rem',
        padding: isHero ? '0.65rem 1rem' : isDesktop ? '0.6rem 1rem' : '0.45rem 0.85rem',
        width: isDesktop ? '100%' : 'auto',
        flex: isHero ? 1 : 'none',
        background: bg,
        border: border,
        borderRadius: isHero ? '0.65rem' : '0.5rem',
        cursor: isPending ? 'wait' : 'pointer',
        transition: 'all 0.18s ease',
        transform: animating ? 'scale(1.04)' : isHovered && isHero ? 'translateY(-1px)' : 'scale(1)',
        opacity: isPending ? 0.8 : 1,
        boxShadow: optimisticUpvoted && isHero ? '0 4px 14px rgba(229, 9, 20, 0.25)' : 'none',
      }}
      className={animating ? 'upvote-animate' : ''}
    >
      <ArrowUp
        size={isHero ? 16 : 14}
        strokeWidth={2.75}
        style={{ color: arrowColor, transition: 'color 0.2s' }}
      />
      <span style={{
        fontSize: isHero ? '0.9rem' : '0.85rem',
        fontWeight: 700,
        lineHeight: 1,
        color: textColor,
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
