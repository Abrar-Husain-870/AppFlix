'use client'

import React, { useState } from 'react'
import { MessageSquare, ChevronDown, ChevronUp, Lock, Sparkles } from 'lucide-react'
import ReviewModal from './ReviewModal'
import { ProjectComment } from '@/app/actions/comments'
import Link from 'next/link'

interface Props {
  projectId: string
  slug: string
  isDeveloper: boolean
  isLoggedIn: boolean
  initialComments: ProjectComment[]
}

export default function ProjectCommentsSection({
  projectId,
  slug,
  isDeveloper,
  isLoggedIn,
  initialComments,
}: Props) {
  const [comments, setComments] = useState<ProjectComment[]>(initialComments)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const totalCount = comments.length
  const visibleComments = isExpanded ? comments : comments.slice(0, 5)
  const hasMoreThan5 = totalCount > 5

  const refreshComments = async () => {
    try {
      const { getProjectComments } = await import('@/app/actions/comments')
      const updated = await getProjectComments(projectId)
      setComments(updated)
    } catch (err) {
      console.error('Failed to refresh comments:', err)
    }
  }

  return (
    <div id="comments-section" style={{
      background: '#1A1A1A',
      border: '1px solid #2B2B2B',
      borderRadius: '0.85rem',
      padding: '1.75rem',
      marginTop: '2rem',
    }}>
      {/* ── 1. Section Header & Action Button ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.75rem',
        paddingBottom: '1.25rem',
        borderBottom: '1px solid #262626',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <MessageSquare size={20} style={{ color: '#E50914' }} />
            <h2 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              App Comments
            </h2>
            <span style={{
              background: '#2B2B2B',
              color: '#AAAAAA',
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
            }}>
              {totalCount}
            </span>
          </div>
          <p style={{ color: '#888888', fontSize: '0.82rem', margin: '0.3rem 0 0 0' }}>
            User thoughts, feedback, and community discussion.
          </p>
        </div>

        {/* Action Button: Only visitors can comment */}
        {isDeveloper ? (
          <div style={{
            fontSize: '0.78rem',
            color: '#777777',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid #262626',
            borderRadius: '0.5rem',
            padding: '0.5rem 0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}>
            <Lock size={13} />
            <span>Developer of this app (comments disabled for owner)</span>
          </div>
        ) : isLoggedIn ? (
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              background: '#E50914',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '0.65rem 1.25rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background 0.2s, transform 0.15s',
              boxShadow: '0 4px 15px rgba(229, 9, 20, 0.35)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#FF0F1F'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#E50914'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <Sparkles size={16} />
            Add a Comment
          </button>
        ) : (
          <Link
            href={`/login?returnUrl=/browse/${slug}`}
            style={{
              background: '#2B2B2B',
              color: '#FFFFFF',
              border: '1px solid #333333',
              borderRadius: '0.5rem',
              padding: '0.65rem 1.25rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
            }}
          >
            Sign in to Comment
          </Link>
        )}
      </div>

      {/* ── 2. Comments List ── */}
      {totalCount === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '2.5rem 1rem',
          background: '#141414',
          border: '1px dashed #2B2B2B',
          borderRadius: '0.75rem',
        }}>
          <MessageSquare size={32} style={{ color: '#444444', marginBottom: '0.75rem' }} />
          <h4 style={{ color: '#FFFFFF', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.3rem' }}>
            No comments yet
          </h4>
          <p style={{ color: '#888888', fontSize: '0.82rem', margin: 0 }}>
            {isDeveloper
              ? 'Visitors will be able to share their comments and feedback here.'
              : 'Be the first visitor to leave a comment for this app!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {visibleComments.map(c => {
            const authorName = c.user_profile?.display_name || c.user_profile?.username || 'Verified User'
            const formattedDate = new Date(c.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })

            return (
              <div key={c.id} style={{
                background: '#141414',
                border: '1px solid #262626',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                transition: 'border-color 0.2s',
              }}>
                {/* Author Info & Date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    {c.user_profile?.avatar_url ? (
                      <img
                        src={c.user_profile.avatar_url}
                        alt={authorName}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#2B2B2B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#AAAAAA',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                      }}>
                        {authorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.875rem' }}>
                        {authorName}
                      </div>
                      <div style={{ color: '#666666', fontSize: '0.72rem' }}>
                        {formattedDate}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Headline / Tagline */}
                <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.95rem', margin: '0.2rem 0 0 0' }}>
                  "{c.headline}"
                </div>

                {/* Detailed Comment */}
                <p style={{ color: '#CCCCCC', fontSize: '0.85rem', lineHeight: 1.55, margin: 0, whiteSpace: 'pre-line' }}>
                  {c.comment}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* ── 3. Amazon / Flipkart Approach: Expandable "View All Comments" Button ── */}
      {hasMoreThan5 && (
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: '#242424',
              border: '1px solid #333333',
              borderRadius: '0.6rem',
              color: '#FFFFFF',
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#2D2D2D'
              e.currentTarget.style.borderColor = '#444444'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#242424'
              e.currentTarget.style.borderColor = '#333333'
            }}
          >
            {isExpanded ? (
              <>
                Show Top 5 Comments <ChevronUp size={16} />
              </>
            ) : (
              <>
                See all {totalCount} comments <ChevronDown size={16} />
              </>
            )}
          </button>
        </div>
      )}

      {/* Modal */}
      <ReviewModal
        projectId={projectId}
        slug={slug}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refreshComments}
      />
    </div>
  )
}
