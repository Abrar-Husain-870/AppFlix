'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  X, Lock, Send, CheckCircle2, AlertCircle, MessageSquare,
  Clock, Trash2, Loader2, Sparkles
} from 'lucide-react'
import {
  ProjectFeedbackItem,
  getUserFeedbackForProject,
  submitPrivateFeedback,
  deletePrivateFeedback
} from '@/app/actions/feedback'

interface Props {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
  developerName?: string
  isOwner?: boolean
}

const CATEGORIES = [
  { id: 'suggestion', label: '💡 Suggestion' },
  { id: 'bug_report', label: '🐛 Bug Report' },
  { id: 'question', label: '❓ Question' },
  { id: 'general', label: '💬 General' },
]

export default function PrivateFeedbackModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  developerName,
  isOwner = false,
}: Props) {
  const [category, setCategory] = useState('suggestion')
  const [message, setMessage] = useState('')
  const [existingFeedback, setExistingFeedback] = useState<ProjectFeedbackItem | null>(null)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!isOpen) return
    setLoadingInitial(true)
    setStatusMessage(null)

    getUserFeedbackForProject(projectId)
      .then(fb => {
        setExistingFeedback(fb)
        if (fb) {
          setCategory(fb.category)
          setMessage(fb.message)
        } else {
          setMessage('')
        }
      })
      .finally(() => setLoadingInitial(false))
  }, [isOpen, projectId])

  if (!isOpen) return null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return

    setStatusMessage(null)
    startTransition(async () => {
      const res = await submitPrivateFeedback(projectId, category, message)
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Your private feedback was sent directly to the developer!' })
        // Reload existing feedback
        const updated = await getUserFeedbackForProject(projectId)
        setExistingFeedback(updated)
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to send feedback.' })
      }
    })
  }

  function handleDeleteThread() {
    if (!existingFeedback) return
    if (!confirm('Delete this private feedback thread permanently?')) return

    startTransition(async () => {
      await deletePrivateFeedback(existingFeedback.id)
      setExistingFeedback(null)
      setMessage('')
      setStatusMessage({ type: 'success', text: 'Feedback thread deleted successfully.' })
    })
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      animation: 'fadeIn 0.15s ease',
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #181212 0%, #121212 25%, #0E0E0E 100%)',
        border: '1px solid #2B2B2B',
        borderRadius: '0.85rem',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 25px rgba(229, 9, 20, 0.12)',
        maxWidth: '520px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #222222',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ width: '2rem', height: '3px', background: '#E50914', borderRadius: '2px', marginBottom: '0.4rem' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
                Private Feedback
              </h3>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                padding: '0.15rem 0.5rem',
                borderRadius: '999px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60A5FA',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}>
                <Lock size={10} /> Confidential
              </span>
            </div>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#888888' }}>
              Direct message to the creator of <strong style={{ color: '#FFFFFF' }}>{projectName}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#888888',
              borderRadius: '0.4rem',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#FFFFFF'
              e.currentTarget.style.borderColor = '#E50914'
              e.currentTarget.style.background = '#E50914'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#888888'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {isOwner ? (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '0.5rem',
              padding: '1rem',
              color: '#FF6B6B',
              fontSize: '0.85rem',
            }}>
              You are the developer of this app. View incoming feedback from users in your <a href="/dashboard/projects" style={{ color: '#FFFFFF', textDecoration: 'underline' }}>developer dashboard</a>.
            </div>
          ) : loadingInitial ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', color: '#888888', gap: '0.5rem' }}>
              <Loader2 size={18} className="animate-spin" /> Loading feedback...
            </div>
          ) : (
            <>
              {/* Developer Reply Card (if developer has replied) */}
              {existingFeedback?.developer_reply && (
                <div style={{
                  background: 'rgba(46, 204, 113, 0.08)',
                  border: '1px solid rgba(46, 204, 113, 0.3)',
                  borderRadius: '0.6rem',
                  padding: '1rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: '#2ECC71',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}>
                      <MessageSquare size={13} /> Developer Response
                    </span>
                    {existingFeedback.developer_replied_at && (
                      <span style={{ fontSize: '0.68rem', color: '#888888' }}>
                        {new Date(existingFeedback.developer_replied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#FFFFFF', lineHeight: 1.45 }}>
                    &quot;{existingFeedback.developer_reply}&quot;
                  </p>
                </div>
              )}

              {/* Status Message Banner */}
              {statusMessage && (
                <div style={{
                  background: statusMessage.type === 'success' ? 'rgba(46, 204, 113, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                  border: `1px solid ${statusMessage.type === 'success' ? 'rgba(46, 204, 113, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: statusMessage.type === 'success' ? '#2ECC71' : '#FF6B6B',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}>
                  {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {statusMessage.text}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Category Pills */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#DDDDDD', marginBottom: '0.4rem' }}>
                    Feedback Category:
                  </label>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        style={{
                          background: category === cat.id ? '#E50914' : '#1A1A1A',
                          border: `1px solid ${category === cat.id ? '#E50914' : '#2B2B2B'}`,
                          color: category === cat.id ? '#FFFFFF' : '#AAAAAA',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.35rem 0.75rem',
                          borderRadius: '999px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea with Character Limit (Max 500) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#DDDDDD' }}>
                      Your Note:
                    </label>
                    <span style={{ fontSize: '0.7rem', color: message.length >= 480 ? '#FF6B6B' : '#777777' }}>
                      {message.length} / 500 chars
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    maxLength={500}
                    placeholder="Share bugs, suggestions, or constructive questions with the developer..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#141414',
                      border: '1px solid #2B2B2B',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                      lineHeight: 1.45,
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                    onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'}
                  />
                </div>

                {/* Privacy info footer note */}
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#777777', lineHeight: 1.4 }}>
                  🔒 <strong>Strictly Private:</strong> This message will NOT appear publicly on the app page or in search results. Only you and the app developer can read it.
                </p>

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                  {existingFeedback ? (
                    <button
                      type="button"
                      onClick={handleDeleteThread}
                      disabled={isPending}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#EF4444',
                        padding: '0.5rem 0.85rem',
                        borderRadius: '0.4rem',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
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
                      <Trash2 size={13} /> Delete Thread
                    </button>
                  ) : <div />}

                  <button
                    type="submit"
                    disabled={isPending || !message.trim()}
                    style={{
                      background: '#E50914',
                      border: 'none',
                      color: '#FFFFFF',
                      padding: '0.55rem 1.25rem',
                      borderRadius: '0.4rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: isPending || !message.trim() ? 'not-allowed' : 'pointer',
                      opacity: isPending || !message.trim() ? 0.6 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 15px rgba(229, 9, 20, 0.4)',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      if (!isPending && message.trim()) e.currentTarget.style.background = '#F40612'
                    }}
                    onMouseLeave={e => {
                      if (!isPending && message.trim()) e.currentTarget.style.background = '#E50914'
                    }}
                  >
                    {isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    {existingFeedback ? 'Update Feedback' : 'Send Feedback'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function PrivateFeedbackButton({
  projectId,
  projectName,
  developerName,
  isOwner = false,
  requireAuth = false,
  variant = 'compact',
}: {
  projectId: string
  projectName: string
  developerName?: string
  isOwner?: boolean
  requireAuth?: boolean
  variant?: 'compact' | 'full'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  function handleClick() {
    if (requireAuth) {
      router.push('/login')
      return
    }
    setIsOpen(true)
  }

  return (
    <>
      <button
        id={`private-feedback-btn-${projectId}`}
        onClick={handleClick}
        title={isOwner ? "View your app's feedback info" : "Send private feedback directly to the developer"}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.45rem',
          padding: '0.6rem 0.9rem',
          background: '#181818',
          border: '1px solid #333333',
          color: '#DDDDDD',
          fontSize: '0.82rem',
          fontWeight: 600,
          borderRadius: '0.5rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          width: variant === 'full' ? '100%' : 'auto',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(229, 9, 20, 0.7)'
          e.currentTarget.style.color = '#FFFFFF'
          e.currentTarget.style.background = '#222222'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = '#333333'
          e.currentTarget.style.color = '#DDDDDD'
          e.currentTarget.style.background = '#181818'
        }}
      >
        <Lock size={13} style={{ color: '#E50914' }} />
        <span>Private Feedback</span>
      </button>

      {isOpen && (
        <PrivateFeedbackModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          projectId={projectId}
          projectName={projectName}
          developerName={developerName}
          isOwner={isOwner}
        />
      )}
    </>
  )
}
