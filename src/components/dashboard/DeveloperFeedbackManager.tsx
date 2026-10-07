'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  MessageSquare, Lock, Trash2, Send, CornerDownRight,
  ChevronDown, ChevronUp, Clock, CheckCircle2, AlertCircle, Loader2,
  ExternalLink, User, ShieldCheck
} from 'lucide-react'
import {
  ProjectFeedbackItem,
  replyToPrivateFeedback,
  deletePrivateFeedback
} from '@/app/actions/feedback'

interface Props {
  feedbackList: ProjectFeedbackItem[]
}

const CATEGORY_STYLES: Record<string, { label: string; bg: string; color: string; border: string }> = {
  suggestion: {
    label: '💡 Suggestion',
    bg: 'rgba(59, 130, 246, 0.12)',
    color: '#60A5FA',
    border: 'rgba(59, 130, 246, 0.3)',
  },
  bug_report: {
    label: '🐛 Bug Report',
    bg: 'rgba(239, 68, 68, 0.12)',
    color: '#F87171',
    border: 'rgba(239, 68, 68, 0.3)',
  },
  question: {
    label: '❓ Question',
    bg: 'rgba(245, 158, 11, 0.12)',
    color: '#FBBF24',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  general: {
    label: '💬 General',
    bg: 'rgba(156, 163, 175, 0.12)',
    color: '#D1D5DB',
    border: 'rgba(156, 163, 175, 0.3)',
  },
}

export default function DeveloperFeedbackManager({ feedbackList: initialList }: Props) {
  const [items, setItems] = useState<ProjectFeedbackItem[]>(initialList || [])
  const [isExpanded, setIsExpanded] = useState(initialList && initialList.length > 0)
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null)
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({})
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [statusMap, setStatusMap] = useState<Record<string, { type: 'success' | 'error'; text: string }>>({})
  const [isPending, startTransition] = useTransition()

  if (!items || items.length === 0) {
    return null
  }

  function handleOpenReply(item: ProjectFeedbackItem) {
    setActiveReplyId(item.id)
    setReplyTextMap(prev => ({
      ...prev,
      [item.id]: prev[item.id] !== undefined ? prev[item.id] : (item.developer_reply || '')
    }))
  }

  function handleSendReply(itemId: string) {
    const text = replyTextMap[itemId]?.trim()
    if (!text) return

    setPendingId(itemId)
    setStatusMap(prev => ({ ...prev, [itemId]: undefined as any }))

    startTransition(async () => {
      const res = await replyToPrivateFeedback(itemId, text)
      if (res.success) {
        setStatusMap(prev => ({
          ...prev,
          [itemId]: { type: 'success', text: 'Reply sent privately to the user!' }
        }))
        setItems(prev => prev.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              developer_reply: text,
              developer_replied_at: new Date().toISOString(),
              status: 'replied',
            }
          }
          return item
        }))
        setActiveReplyId(null)
      } else {
        setStatusMap(prev => ({
          ...prev,
          [itemId]: { type: 'error', text: res.error || 'Failed to send reply' }
        }))
      }
      setPendingId(null)
    })
  }

  function handleDelete(itemId: string) {
    if (!confirm('Permanently delete this private feedback thread? This will immediately free database storage.')) {
      return
    }

    setPendingId(itemId)
    startTransition(async () => {
      const res = await deletePrivateFeedback(itemId)
      if (res.success) {
        setItems(prev => prev.filter(i => i.id !== itemId))
      } else {
        alert(res.error || 'Failed to delete feedback thread.')
      }
      setPendingId(null)
    })
  }

  return (
    <div style={{
      background: 'linear-gradient(145deg, #121212 0%, #0D0D0D 100%)',
      border: '1px solid #2B2B2B',
      borderRadius: '0.75rem',
      marginBottom: '2rem',
      overflow: 'hidden',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
    }}>
      {/* Header Bar */}
      <div
        onClick={() => setIsExpanded(prev => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          cursor: 'pointer',
          userSelect: 'none',
          background: isExpanded ? 'rgba(229, 9, 20, 0.05)' : 'transparent',
          borderBottom: isExpanded ? '1px solid #222222' : 'none',
          transition: 'background 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '0.5rem',
            background: 'rgba(229, 9, 20, 0.15)',
            border: '1px solid rgba(229, 9, 20, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#E50914',
          }}>
            <Lock size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.01em' }}>
                Private User Feedback
              </h2>
              <span style={{
                background: '#E50914',
                color: '#FFFFFF',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '0.1rem 0.5rem',
                borderRadius: '9999px',
              }}>
                {items.length}
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#888888', margin: '0.15rem 0 0 0' }}>
              Direct confidential messages from users for your apps
            </p>
          </div>
        </div>

        <button
          type="button"
          aria-label={isExpanded ? 'Collapse feedback' : 'Expand feedback'}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#AAAAAA',
            cursor: 'pointer',
            padding: '0.35rem',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {/* Accordion Content */}
      {isExpanded && (
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map(item => {
            const catStyle = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.general
            const isReplying = activeReplyId === item.id
            const currentReplyText = replyTextMap[item.id] !== undefined ? replyTextMap[item.id] : (item.developer_reply || '')
            const itemStatus = statusMap[item.id]
            const isActionPending = pendingId === item.id && isPending

            return (
              <div
                key={item.id}
                style={{
                  background: '#161616',
                  border: '1px solid #282828',
                  borderRadius: '0.65rem',
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Top Metadata Row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    {/* User Avatar & Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <div style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: '#2B2B2B',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#DDDDDD',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        overflow: 'hidden',
                      }}>
                        {item.user_profile?.avatar_url ? (
                          <img
                            src={item.user_profile.avatar_url}
                            alt="User"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <User size={13} />
                        )}
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>
                        {item.user_profile?.display_name || item.user_profile?.username || 'User'}
                      </span>
                    </div>

                    {/* Project Tag */}
                    {item.project && (
                      <Link
                        href={`/browse/${item.project.slug}`}
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: '#E50914',
                          background: 'rgba(229, 9, 20, 0.08)',
                          border: '1px solid rgba(229, 9, 20, 0.25)',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '0.35rem',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        {item.project.name}
                        <ExternalLink size={10} />
                      </Link>
                    )}

                    {/* Category Chip */}
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: catStyle.color,
                      background: catStyle.bg,
                      border: `1px solid ${catStyle.border}`,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '0.35rem',
                    }}>
                      {catStyle.label}
                    </span>
                  </div>

                  {/* Date & Quick Permanent Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#666666', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={11} />
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={isActionPending}
                      title="Permanently delete this thread to free database storage"
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#EF4444',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.35rem',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: isActionPending ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#EF4444'
                        e.currentTarget.style.color = '#FFFFFF'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = '#EF4444'
                      }}
                    >
                      <Trash2 size={12} />
                      Delete ✕
                    </button>
                  </div>
                </div>

                {/* Feedback Message Content */}
                <div style={{
                  background: '#0F0F0F',
                  border: '1px solid #222222',
                  borderRadius: '0.5rem',
                  padding: '0.85rem 1rem',
                  color: '#DDDDDD',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {item.message}
                </div>

                {/* Developer Existing Reply or Input */}
                {item.developer_reply && !isReplying && (
                  <div style={{
                    background: 'rgba(229, 9, 20, 0.04)',
                    border: '1px solid rgba(229, 9, 20, 0.25)',
                    borderRadius: '0.5rem',
                    padding: '0.85rem 1rem',
                    marginTop: '0.25rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        color: '#E50914',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}>
                        <ShieldCheck size={12} /> Your Confidential Reply:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenReply(item)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#AAAAAA',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                        }}
                      >
                        Edit Reply
                      </button>
                    </div>
                    <p style={{
                      color: '#E0E0E0',
                      fontSize: '0.83rem',
                      lineHeight: 1.5,
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {item.developer_reply}
                    </p>
                  </div>
                )}

                {/* Status Message if any */}
                {itemStatus && (
                  <div style={{
                    fontSize: '0.78rem',
                    color: itemStatus.type === 'success' ? '#2ECC71' : '#EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}>
                    {itemStatus.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                    {itemStatus.text}
                  </div>
                )}

                {/* Reply Form / Action Button */}
                {!item.developer_reply && !isReplying && (
                  <div>
                    <button
                      type="button"
                      onClick={() => handleOpenReply(item)}
                      style={{
                        background: '#1F1F1F',
                        border: '1px solid #333333',
                        color: '#FFFFFF',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '0.45rem 0.85rem',
                        borderRadius: '0.4rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#E50914'
                        e.currentTarget.style.background = '#282828'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#333333'
                        e.currentTarget.style.background = '#1F1F1F'
                      }}
                    >
                      <CornerDownRight size={13} style={{ color: '#E50914' }} />
                      Reply Privately
                    </button>
                  </div>
                )}

                {isReplying && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <div style={{ position: 'relative' }}>
                      <textarea
                        value={currentReplyText}
                        onChange={e => setReplyTextMap(prev => ({ ...prev, [item.id]: e.target.value.slice(0, 500) }))}
                        placeholder="Write a confidential reply directly to the user (max 500 chars)..."
                        rows={3}
                        maxLength={500}
                        style={{
                          width: '100%',
                          background: '#0D0D0D',
                          border: '1px solid #333333',
                          borderRadius: '0.5rem',
                          padding: '0.65rem 0.85rem',
                          color: '#FFFFFF',
                          fontSize: '0.82rem',
                          lineHeight: 1.5,
                          outline: 'none',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box',
                        }}
                      />
                      <div style={{
                        textAlign: 'right',
                        fontSize: '0.68rem',
                        color: currentReplyText.length > 450 ? '#EF4444' : '#666666',
                        marginTop: '0.2rem',
                      }}>
                        {currentReplyText.length}/500 chars
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setActiveReplyId(null)}
                        style={{
                          background: 'transparent',
                          border: '1px solid #333333',
                          color: '#AAAAAA',
                          padding: '0.4rem 0.85rem',
                          borderRadius: '0.35rem',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendReply(item.id)}
                        disabled={isActionPending || !currentReplyText.trim()}
                        style={{
                          background: '#E50914',
                          border: 'none',
                          color: '#FFFFFF',
                          padding: '0.4rem 1rem',
                          borderRadius: '0.35rem',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: isActionPending || !currentReplyText.trim() ? 'not-allowed' : 'pointer',
                          opacity: isActionPending || !currentReplyText.trim() ? 0.6 : 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        {isActionPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                        Send Private Reply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
