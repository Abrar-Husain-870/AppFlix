'use client'

import React, { useState } from 'react'
import {
  MessageSquare, ChevronDown, ChevronUp, Lock, Sparkles, Pencil, Trash2, Loader2,
  CornerDownRight, ShieldCheck, Send
} from 'lucide-react'
import ReviewModal from './ReviewModal'
import { ProjectComment, deleteComment, replyToComment, deleteDeveloperReply } from '@/app/actions/comments'
import Link from 'next/link'

interface Props {
  projectId: string
  slug: string
  isDeveloper: boolean
  isLoggedIn: boolean
  currentUserId: string | null
  initialComments: ProjectComment[]
}

export default function ProjectCommentsSection({
  projectId,
  slug,
  isDeveloper,
  isLoggedIn,
  currentUserId,
  initialComments,
}: Props) {
  const [comments, setComments] = useState<ProjectComment[]>(initialComments)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingComment, setEditingComment] = useState<ProjectComment | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Developer reply state
  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(null)
  const [replyInput, setReplyInput] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [replyError, setReplyError] = useState<string | null>(null)

  const totalCount = comments.length
  const visibleComments = isExpanded ? comments : comments.slice(0, 3)
  const hasMoreThan3 = totalCount > 3

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
    if (!window.confirm('Are you sure you want to delete your comment?')) {
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

        {/* Action Button */}
        {isDeveloper ? (
          <div style={{
            fontSize: '0.78rem',
            color: '#AAAAAA',
            background: 'rgba(229, 9, 20, 0.1)',
            border: '1px solid rgba(229, 9, 20, 0.25)',
            borderRadius: '0.5rem',
            padding: '0.5rem 0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontWeight: 600,
          }}>
            <ShieldCheck size={14} style={{ color: '#E50914' }} />
            <span>Developer Mode (reply to user comments below)</span>
          </div>
        ) : isLoggedIn ? (
          existingUserComment ? (
            <button
              onClick={() => handleOpenEdit(existingUserComment)}
              style={{
                background: '#2B2B2B',
                color: '#FFFFFF',
                border: '1px solid #333333',
                borderRadius: '0.5rem',
                padding: '0.65rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s',
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
          )
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
            const isAuthor = currentUserId === c.user_id
            const authorName = c.user_profile?.display_name || c.user_profile?.username || 'Verified User'
            const formattedDate = new Date(c.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
            const isEdited = c.updated_at && c.updated_at !== c.created_at

            const isReplyingThis = replyingCommentId === c.id

            return (
              <div key={c.id} style={{
                background: '#141414',
                border: isAuthor ? '1px solid rgba(229, 9, 20, 0.35)' : '1px solid #262626',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
                position: 'relative',
                transition: 'border-color 0.2s',
              }}>
                {/* Author Info & Actions */}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.875rem' }}>
                          {authorName}
                        </span>
                        {isAuthor && (
                          <span style={{
                            background: 'rgba(229, 9, 20, 0.15)',
                            color: '#FF6B6B',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.4rem',
                            borderRadius: '0.3rem',
                            border: '1px solid rgba(229, 9, 20, 0.3)',
                          }}>
                            You
                          </span>
                        )}
                      </div>
                      <div style={{ color: '#666666', fontSize: '0.72rem' }}>
                        {formattedDate} {isEdited && '(edited)'}
                      </div>
                    </div>
                  </div>

                  {/* Actions for Author vs Developer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {isAuthor && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          title="Edit Comment"
                          style={{
                            background: '#262626',
                            border: 'none',
                            borderRadius: '0.4rem',
                            padding: '0.4rem 0.65rem',
                            color: '#AAAAAA',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.color = '#FFFFFF'
                            e.currentTarget.style.background = '#333333'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.color = '#AAAAAA'
                            e.currentTarget.style.background = '#262626'
                          }}
                        >
                          <Pencil size={13} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          title="Delete Comment"
                          style={{
                            background: 'rgba(229, 9, 20, 0.1)',
                            border: 'none',
                            borderRadius: '0.4rem',
                            padding: '0.4rem 0.65rem',
                            color: '#FF6B6B',
                            fontSize: '0.78rem',
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
                            <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <Trash2 size={13} />
                          )}
                          Delete
                        </button>
                      </>
                    )}

                    {/* Developer Reply Button */}
                    {isDeveloper && (
                      <button
                        onClick={() => handleOpenReplyForm(c)}
                        style={{
                          background: isReplyingThis ? '#E50914' : '#262626',
                          color: isReplyingThis ? '#FFFFFF' : '#AAAAAA',
                          border: 'none',
                          borderRadius: '0.4rem',
                          padding: '0.4rem 0.75rem',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          transition: 'all 0.15s',
                        }}
                      >
                        <CornerDownRight size={13} />
                        {c.developer_reply ? 'Edit Reply' : 'Reply'}
                      </button>
                    )}
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

                {/* ── Developer Response Card ── */}
                {c.developer_reply && (
                  <div style={{
                    marginTop: '0.6rem',
                    background: 'linear-gradient(135deg, rgba(229, 9, 20, 0.08) 0%, rgba(20, 20, 20, 0.95) 100%)',
                    borderLeft: '3px solid #E50914',
                    borderTop: '1px solid rgba(229, 9, 20, 0.2)',
                    borderRight: '1px solid rgba(229, 9, 20, 0.2)',
                    borderBottom: '1px solid rgba(229, 9, 20, 0.2)',
                    borderRadius: '0.6rem',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <ShieldCheck size={14} style={{ color: '#E50914' }} />
                        <span style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.02em' }}>
                          Developer Response
                        </span>
                        {c.developer_replied_at && (
                          <span style={{ color: '#666666', fontSize: '0.7rem', marginLeft: '0.3rem' }}>
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
                            color: '#777777',
                            cursor: 'pointer',
                            fontSize: '0.72rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#FF6B6B')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#777777')}
                        >
                          <Trash2 size={12} /> Delete Reply
                        </button>
                      )}
                    </div>
                    <p style={{ color: '#E0E0E0', fontSize: '0.83rem', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-line' }}>
                      {c.developer_reply}
                    </p>
                  </div>
                )}

                {/* ── Inline Developer Reply Form ── */}
                {isReplyingThis && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '1rem',
                    background: '#1A1A1A',
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
                        background: '#141414',
                        border: '1px solid #333333',
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
                          background: '#2B2B2B',
                          border: 'none',
                          borderRadius: '0.4rem',
                          color: '#AAAAAA',
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

      {/* ── 3. Amazon / Flipkart Approach: Expandable "View All Comments" Button ── */}
      {hasMoreThan3 && (
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
                Show Top 3 Comments <ChevronUp size={16} />
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
        editComment={editingComment}
      />
    </div>
  )
}
