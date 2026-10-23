'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  MessageSquare, ChevronLeft, ChevronRight, Pencil, Trash2, Loader2,
  CornerDownRight, ShieldCheck, Send, Star, ArrowUpDown, Clock, ThumbsUp, ThumbsDown
} from 'lucide-react'
import ReviewModal from './ReviewModal'
import { ProjectComment, deleteComment, replyToComment, deleteDeveloperReply } from '@/app/actions/comments'
import Link from 'next/link'

interface Props {
  projectId: string
  slug: string
  isDeveloper: boolean
  isLoggedIn: boolean
  isAdmin?: boolean
  currentUserId: string | null
  initialComments: ProjectComment[]
  projectStage?: string
  projectPlatforms?: string[]
}

type CommentSortOption = 'latest' | 'positive' | 'negative'

function getAvatarBg(name: string) {
  const colors = ['#6366F1', '#4F46E5', '#3B82F6', '#0D9488', '#8B5CF6', '#EC4899', '#10B981']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export default function ProjectCommentsSection({
  projectId,
  slug,
  isDeveloper,
  isLoggedIn,
  isAdmin = false,
  currentUserId,
  initialComments,
  projectStage,
  projectPlatforms,
}: Props) {
  const [comments, setComments] = useState<ProjectComment[]>(initialComments)
  const [sortBy, setSortBy] = useState<CommentSortOption>('latest')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingComment, setEditingComment] = useState<ProjectComment | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Sync state if server initialComments changes
  useEffect(() => {
    setComments(initialComments)
  }, [initialComments])

  // Developer reply state
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null)
  const [replyInput, setReplyInput] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)

  const PAGE_SIZE = 3
  const totalCount = comments.length

  // Sort ALL comments for this project (reorders the full collection globally before paginating)
  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      if (sortBy === 'positive') {
        const diff = (b.rating ?? 5) - (a.rating ?? 5)
        if (diff !== 0) return diff
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (sortBy === 'negative') {
        const diff = (a.rating ?? 5) - (b.rating ?? 5)
        if (diff !== 0) return diff
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      // 'latest'
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [comments, sortBy])

  // Pagination calculation: 1-3, 4-6, 7-9, etc.
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages)
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalCount)
  const visibleComments = sortedComments.slice(startIndex, startIndex + PAGE_SIZE)
  const rangeDisplay = (startIndex + 1 === endIndex)
    ? `${endIndex}`
    : `${startIndex + 1}–${endIndex}`

  const handleSortChange = (newSort: CommentSortOption) => {
    setSortBy(newSort)
    setCurrentPage(1)
  }

  const handlePrevPage = () => {
    if (safeCurrentPage > 1) {
      setCurrentPage(prev => prev - 1)
      const el = document.getElementById('comments-section')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleNextPage = () => {
    if (safeCurrentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
      const el = document.getElementById('comments-section')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleSelectPage = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    const el = document.getElementById('comments-section')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Check if current logged-in user has already posted a comment
  const existingUserComment = currentUserId
    ? comments.find(c => c.user_id === currentUserId)
    : null

  const refreshComments = async () => {
    try {
      const { getProjectComments } = await import('@/app/actions/comments')
      const updated = await getProjectComments(projectId)
      setComments(updated)
    } catch (err) {
      console.error('Failed to refresh comments:', err)
    }
  }

  const handleOpenCreate = () => {
    setEditingComment(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (comment: ProjectComment) => {
    setEditingComment(comment)
    setIsModalOpen(true)
  }

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return
    }
    try {
      setDeletingId(commentId)
      await deleteComment(commentId, projectId, slug)
      await refreshComments()
    } catch (err: any) {
      alert(err.message || 'Failed to delete comment.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleOpenReplyForm = (comment: ProjectComment) => {
    setReplyingCommentId(comment.id)
    setReplyInput(comment.developer_reply || '')
    setReplyError(null)
  }

  const handleSubmitReply = async (commentId: string) => {
    if (!replyInput.trim()) {
      setReplyError('Please enter a reply message.')
      return
    }
    try {
      setReplyLoading(true)
      setReplyError(null)
      await replyToComment(commentId, projectId, slug, replyInput)
      setReplyingCommentId(null)
      setReplyInput('')
      await refreshComments()
    } catch (err: any) {
      setReplyError(err.message || 'Failed to submit reply.')
    } finally {
      setReplyLoading(false)
    }
  }

  const handleDeleteReply = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete your developer reply?')) {
      return
    }
    try {
      await deleteDeveloperReply(commentId, projectId, slug)
      await refreshComments()
    } catch (err: any) {
      alert(err.message || 'Failed to delete reply.')
    }
  }

  return (
    <div id="comments-section" style={{
      marginTop: '2.75rem',
      width: '100%',
    }}>
      {/* ── 1. Section Header & Action Button (Open layout matching screenshot) ── */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <MessageSquare size={22} style={{ color: '#E50914', fill: 'rgba(229, 9, 20, 0.2)' }} />
            <h2 style={{ color: '#FFFFFF', fontSize: '1.35rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              App Comments
            </h2>
            <span style={{
              background: '#222224',
              color: '#A1A1AA',
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '0.15rem 0.6rem',
              borderRadius: '9999px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}>
              {totalCount}
            </span>
          </div>
          <p style={{ color: '#8E8E93', fontSize: '0.88rem', margin: '0.35rem 0 0 0' }}>
            User thoughts, satisfaction ratings, and community discussion.
          </p>
        </div>

        {/* Action Button */}
        {isDeveloper ? (
          <div style={{
            fontSize: '0.8rem',
            color: '#D4D4D8',
            background: 'rgba(229, 9, 20, 0.1)',
            border: '1px solid rgba(229, 9, 20, 0.25)',
            borderRadius: '0.5rem',
            padding: '0.55rem 0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontWeight: 600,
          }}>
            <ShieldCheck size={15} style={{ color: '#E50914' }} />
            <span>Developer Mode (reply to user comments below)</span>
          </div>
        ) : isLoggedIn ? (
          existingUserComment ? (
            <button
              onClick={() => handleOpenEdit(existingUserComment)}
              style={{
                background: '#222224',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '0.5rem',
                padding: '0.62rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#2C2C30'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#222224'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
              }}
            >
              <Pencil size={15} />
              Edit Your Comment
            </button>
          ) : (
            <button
              onClick={handleOpenCreate}
              style={{
                background: '#E50914',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.62rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background 0.18s, transform 0.15s, box-shadow 0.18s',
                boxShadow: '0 4px 14px rgba(229, 9, 20, 0.35)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#F40612'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(229, 9, 20, 0.45)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#E50914'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(229, 9, 20, 0.35)'
              }}
            >
              <Pencil size={15} />
              Add a Comment
            </button>
          )
        ) : (
          <Link
            href={`/login?returnUrl=/browse/${slug}`}
            style={{
              background: '#222224',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '0.5rem',
              padding: '0.62rem 1.25rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#2C2C30'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#222224'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
            }}
          >
            Sign in to Comment
          </Link>
        )}
      </div>

      {/* ── 2. Sorting Toolbar (Sort by: Latest | Positive | Negative) ── */}
      {totalCount > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}>
          {/* Left: Sort Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: '#71717A', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
              <ArrowUpDown size={13} /> Sort:
            </span>

            {[
              { id: 'latest',   label: 'Latest',   icon: <Clock size={13} /> },
              { id: 'positive', label: 'Positive', icon: <ThumbsUp size={13} /> },
              { id: 'negative', label: 'Negative', icon: <ThumbsDown size={13} /> },
            ].map(s => {
              const isActive = sortBy === s.id
              return (
                <button
                  key={s.id}
                  id={`sort-comments-${s.id}`}
                  type="button"
                  onClick={() => handleSortChange(s.id as CommentSortOption)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.78rem',
                    fontWeight: isActive ? 700 : 500,
                    borderRadius: '9999px',
                    background: isActive ? '#E50914' : '#141416',
                    border: isActive ? '1px solid #E50914' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: isActive ? '#FFFFFF' : '#A1A1AA',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? '0 2px 8px rgba(229, 9, 20, 0.35)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#FFFFFF'
                      e.currentTarget.style.background = '#1E1E22'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#A1A1AA'
                      e.currentTarget.style.background = '#141416'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                    }
                  }}
                >
                  {s.icon}
                  {s.label}
                </button>
              )
            })}
          </div>

          {/* Right: Showing Range */}
          <div style={{ fontSize: '0.78rem', color: '#71717A', fontWeight: 500 }}>
            Showing <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{rangeDisplay}</span> of <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{totalCount}</span>
          </div>
        </div>
      )}

      {/* ── 3. Comments List (Clean standalone cards matching screenshot) ── */}
      {totalCount === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1.5rem',
          background: '#0D0D0E',
          border: '1px dashed rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
        }}>
          <MessageSquare size={32} style={{ color: '#444444', marginBottom: '0.75rem' }} />
          <h4 style={{ color: '#FFFFFF', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.3rem' }}>
            No comments yet
          </h4>
          <p style={{ color: '#888888', fontSize: '0.82rem', margin: 0 }}>
            {isDeveloper
              ? 'Visitors will be able to share their comments and satisfaction ratings here.'
              : 'Be the first visitor to leave a comment for this app!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {visibleComments.map(c => {
            const isAuthor = currentUserId === c.user_id
            const authorName = c.user_profile?.display_name || c.user_profile?.username || 'Verified User'
            const formattedDate = new Date(c.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
            const isEdited = c.updated_at && c.updated_at !== c.created_at

            const isReplyingThis = replyingCommentId === c.id
            const commentRating = c.rating ?? 5



            return (
              <div
                key={c.id}
                style={{
                  background: '#0D0D0E',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.55rem',
                  position: 'relative',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.45)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {/* Top Row: User Avatar + Name + Tag + Date on Left | Stars + Actions on Right */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}>
                  {/* Left: Avatar + Author Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {c.user_profile?.avatar_url ? (
                      <img
                        src={c.user_profile.avatar_url}
                        alt={authorName}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: getAvatarBg(authorName),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                      }}>
                        {authorName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.95rem' }}>
                          {authorName}
                        </span>
                        {isAuthor && (
                          <span style={{
                            background: 'rgba(229, 9, 20, 0.15)',
                            color: '#FF6B6B',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.45rem',
                            borderRadius: '9999px',
                            border: '1px solid rgba(229, 9, 20, 0.3)',
                          }}>
                            You
                          </span>
                        )}
                      </div>
                      <div style={{ color: '#71717A', fontSize: '0.78rem', marginTop: '0.15rem' }}>
                        {formattedDate} {isEdited && '(edited)'}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions + 5 Stars */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Actions for Author vs Developer vs Admin */}
                    {(isAuthor || isAdmin || isDeveloper) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {isAuthor && (
                          <button
                            onClick={() => handleOpenEdit(c)}
                            title="Edit Comment"
                            style={{
                              background: '#1A1A1D',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '0.4rem',
                              padding: '0.32rem 0.6rem',
                              color: '#A1A1AA',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.color = '#FFFFFF'
                              e.currentTarget.style.background = '#26262B'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.color = '#A1A1AA'
                              e.currentTarget.style.background = '#1A1A1D'
                            }}
                          >
                            <Pencil size={12} /> Edit
                          </button>
                        )}

                        {(isAuthor || isAdmin) && (
                          <button
                            onClick={() => handleDelete(c.id)}
                            disabled={deletingId === c.id}
                            title={isAdmin && !isAuthor ? "Delete Comment (Admin Moderation)" : "Delete Comment"}
                            style={{
                              background: 'rgba(229, 9, 20, 0.1)',
                              border: '1px solid rgba(229, 9, 20, 0.25)',
                              borderRadius: '0.4rem',
                              padding: '0.32rem 0.6rem',
                              color: '#FF6B6B',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              cursor: deletingId === c.id ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'rgba(229, 9, 20, 0.25)'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'rgba(229, 9, 20, 0.1)'
                            }}
                          >
                            {deletingId === c.id ? (
                              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <Trash2 size={12} />
                            )}
                          </button>
                        )}

                        {isDeveloper && (
                          <button
                            onClick={() => handleOpenReplyForm(c)}
                            style={{
                              background: isReplyingThis ? '#E50914' : '#1A1A1D',
                              color: isReplyingThis ? '#FFFFFF' : '#A1A1AA',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '0.4rem',
                              padding: '0.32rem 0.65rem',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              transition: 'all 0.15s',
                            }}
                          >
                            <CornerDownRight size={12} />
                            {c.developer_reply ? 'Edit Reply' : 'Reply'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Gold Star Satisfaction Rating (Matches screenshot) */}
                    <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
                      {[1, 2, 3, 4, 5].map(s => {
                        const isFilled = s <= commentRating
                        return (
                          <Star
                            key={s}
                            size={16}
                            style={{
                              fill: isFilled ? '#F59E0B' : 'transparent',
                              color: isFilled ? '#F59E0B' : '#3F3F46',
                              strokeWidth: 1.5,
                            }}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Headline / Title: "Headline in quotes" */}
                <div style={{
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '1rem',
                  letterSpacing: '-0.01em',
                  marginTop: '0.45rem',
                }}>
                  “{c.headline}”
                </div>

                {/* Detailed Comment Body */}
                <p style={{
                  color: '#CCCCCC',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  margin: 0,
                  whiteSpace: 'pre-line',
                }}>
                  {c.comment}
                </p>

                {/* ── Developer Response Banner (Red Left Accent Border, Flat Clean Look) ── */}
                {c.developer_reply && (
                  <div style={{
                    marginTop: '0.85rem',
                    background: '#161113',
                    borderLeft: '3px solid #E50914',
                    borderRadius: '0 8px 8px 0',
                    padding: '0.85rem 1.15rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <ShieldCheck size={16} style={{ color: '#E50914' }} />
                        <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.84rem' }}>
                          Developer Response
                        </span>
                        {c.developer_replied_at && (
                          <span style={{ color: '#71717A', fontSize: '0.78rem', marginLeft: '0.2rem' }}>
                            • {new Date(c.developer_replied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>

                      {isDeveloper && (
                        <button
                          onClick={() => handleDeleteReply(c.id)}
                          title="Delete Response"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#71717A',
                            cursor: 'pointer',
                            fontSize: '0.72rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#FF6B6B')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#71717A')}
                        >
                          <Trash2 size={12} /> Delete Reply
                        </button>
                      )}
                    </div>
                    <p style={{ color: '#B3B3B7', fontSize: '0.85rem', lineHeight: 1.55, margin: 0, whiteSpace: 'pre-line' }}>
                      {c.developer_reply}
                    </p>
                  </div>
                )}

                {/* ── Inline Developer Reply Form ── */}
                {isReplyingThis && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '1rem',
                    background: '#141417',
                    border: '1px solid rgba(229, 9, 20, 0.4)',
                    borderRadius: '0.65rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    animation: 'fadeIn 0.15s ease-out',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FFFFFF', fontWeight: 700, fontSize: '0.85rem' }}>
                      <CornerDownRight size={14} style={{ color: '#E50914' }} />
                      Reply as App Developer:
                    </div>

                    {replyError && (
                      <div style={{ color: '#FF6B6B', fontSize: '0.78rem' }}>{replyError}</div>
                    )}

                    <textarea
                      rows={3}
                      placeholder="Write your response to this user comment…"
                      value={replyInput}
                      onChange={e => setReplyInput(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        background: '#09090B',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.5rem',
                        color: '#FFFFFF',
                        fontSize: '0.85rem',
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setReplyingCommentId(null)}
                        style={{
                          padding: '0.45rem 0.85rem',
                          background: '#222226',
                          border: 'none',
                          borderRadius: '0.4rem',
                          color: '#A1A1AA',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSubmitReply(c.id)}
                        disabled={replyLoading}
                        style={{
                          padding: '0.45rem 1rem',
                          background: '#E50914',
                          border: 'none',
                          borderRadius: '0.4rem',
                          color: '#FFFFFF',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: replyLoading ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        {replyLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                        Post Reply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── 4. Next / Prev Pagination Bar (Up to 3 comments per page: 1-3, 4-6, 7-9...) ── */}
      {totalCount > 0 && (
        <div style={{
          marginTop: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          {/* Page status text */}
          <div style={{ fontSize: '0.85rem', color: '#8E8E93' }}>
            Showing <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{rangeDisplay}</span> of <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{totalCount}</span>{totalPages > 1 ? ` (Page ${safeCurrentPage} of ${totalPages})` : ''}
          </div>

          {/* Prev / Next Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              id="comments-prev-btn"
              type="button"
              onClick={handlePrevPage}
              disabled={safeCurrentPage <= 1}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: safeCurrentPage <= 1 ? '#111113' : '#1A1A1E',
                color: safeCurrentPage <= 1 ? '#555555' : '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: safeCurrentPage <= 1 ? 'not-allowed' : 'pointer',
                opacity: safeCurrentPage <= 1 ? 0.45 : 1,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (safeCurrentPage > 1) {
                  e.currentTarget.style.background = '#25252B'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)'
                }
              }}
              onMouseLeave={e => {
                if (safeCurrentPage > 1) {
                  e.currentTarget.style.background = '#1A1A1E'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                }
              }}
            >
              <ChevronLeft size={16} /> Prev
            </button>

            {/* Quick Page Indicator Pills */}
            <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1
                const isCurrent = pageNum === safeCurrentPage
                return (
                  <button
                    key={pageNum}
                    id={`comments-page-${pageNum}-btn`}
                    type="button"
                    onClick={() => handleSelectPage(pageNum)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      border: isCurrent ? '1px solid #E50914' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isCurrent ? '#E50914' : '#141416',
                      color: isCurrent ? '#FFFFFF' : '#8E8E93',
                      fontSize: '0.8rem',
                      fontWeight: isCurrent ? 700 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              id="comments-next-btn"
              type="button"
              onClick={handleNextPage}
              disabled={safeCurrentPage >= totalPages}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: safeCurrentPage >= totalPages ? '#111113' : '#1A1A1E',
                color: safeCurrentPage >= totalPages ? '#555555' : '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: safeCurrentPage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: safeCurrentPage >= totalPages ? 0.45 : 1,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (safeCurrentPage < totalPages) {
                  e.currentTarget.style.background = '#25252B'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)'
                }
              }}
              onMouseLeave={e => {
                if (safeCurrentPage < totalPages) {
                  e.currentTarget.style.background = '#1A1A1E'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                }
              }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      <ReviewModal
        projectId={projectId}
        slug={slug}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refreshComments}
        editComment={editingComment}
      />
    </div>
  )
}
