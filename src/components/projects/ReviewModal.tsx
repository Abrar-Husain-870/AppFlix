'use client'

import React, { useState, useEffect } from 'react'
import { MessageSquarePlus, X, Loader2, Edit3, Star } from 'lucide-react'
import { submitComment, updateComment } from '@/app/actions/comments'

interface ReviewModalProps {
  projectId: string
  slug: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editComment?: {
    id: string
    headline: string
    comment: string
    rating?: number
  } | null
}

export default function ReviewModal({
  projectId,
  slug,
  isOpen,
  onClose,
  onSuccess,
  editComment = null,
}: ReviewModalProps) {
  const [rating, setRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [headline, setHeadline] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const isEditing = !!editComment

  useEffect(() => {
    if (editComment) {
      setHeadline(editComment.headline || '')
      setComment(editComment.comment || '')
      setRating(editComment.rating || 5)
    } else {
      setHeadline('')
      setComment('')
      setRating(5)
    }
    setErrorMsg(null)
  }, [editComment, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (rating < 1 || rating > 5) {
      setErrorMsg('Please select a rating between 1 and 5 stars.')
      return
    }
    if (!headline.trim()) {
      setErrorMsg('Please enter a comment summary / tagline (e.g. "Makes matchmaking easy!").')
      return
    }
    if (!comment.trim()) {
      setErrorMsg('Please enter your detailed comment.')
      return
    }

    try {
      setLoading(true)
      if (isEditing && editComment) {
        await updateComment(editComment.id, projectId, slug, headline, comment, rating)
      } else {
        await submitComment(projectId, slug, headline, comment, rating)
      }
      setHeadline('')
      setComment('')
      setRating(5)
      onSuccess()
      onClose()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save comment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.25rem',
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div style={{
        background: '#1A1A1A',
        border: '1px solid #333333',
        borderRadius: '1rem',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #2B2B2B',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {isEditing ? (
              <Edit3 size={20} style={{ color: '#E50914' }} />
            ) : (
              <MessageSquarePlus size={20} style={{ color: '#E50914' }} />
            )}
            <h3 style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>
              {isEditing ? 'Edit Your Comment' : 'Add a Comment'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#888888',
              cursor: 'pointer',
              padding: '0.3rem',
              display: 'flex',
              borderRadius: '0.4rem',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#888888')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {errorMsg && (
            <div style={{
              background: 'rgba(229, 9, 20, 0.12)',
              border: '1px solid rgba(229, 9, 20, 0.3)',
              borderRadius: '0.6rem',
              padding: '0.75rem 1rem',
              color: '#FF6B6B',
              fontSize: '0.85rem',
            }}>
              {errorMsg}
            </div>
          )}

          {/* Star Rating Picker (Satisfaction indicator) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.4rem' }}>
              Satisfaction Rating <span style={{ color: '#E50914' }}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {[1, 2, 3, 4, 5].map(starIndex => {
                const filled = starIndex <= (hoverRating || rating)
                return (
                  <button
                    key={starIndex}
                    type="button"
                    onClick={() => setRating(starIndex)}
                    onMouseEnter={() => setHoverRating(starIndex)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.2rem',
                      display: 'flex',
                      transition: 'transform 0.15s',
                      transform: (hoverRating || rating) === starIndex ? 'scale(1.15)' : 'scale(1)',
                    }}
                  >
                    <Star
                      size={26}
                      style={{
                        fill: filled ? '#F59E0B' : 'none',
                        color: filled ? '#F59E0B' : '#444444',
                        transition: 'fill 0.15s, color 0.15s',
                      }}
                    />
                  </button>
                )
              })}
              <span style={{ marginLeft: '0.5rem', fontSize: '0.82rem', color: '#AAAAAA', fontWeight: 600 }}>
                {(hoverRating || rating)} / 5 stars
              </span>
            </div>
          </div>

          {/* Comment Tagline / Headline */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.4rem' }}>
              Comment Tagline / Summary <span style={{ color: '#E50914' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Makes matchmaking easy!"
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: '#141414',
                border: '1px solid #333333',
                borderRadius: '0.6rem',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#E50914')}
              onBlur={e => (e.currentTarget.style.borderColor = '#333333')}
            />
          </div>

          {/* Detailed Comment */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.4rem' }}>
              Detailed Comment <span style={{ color: '#E50914' }}>*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Share your thoughts, feedback, or experience using this app..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: '#141414',
                border: '1px solid #333333',
                borderRadius: '0.6rem',
                color: '#FFFFFF',
                fontSize: '0.875rem',
                outline: 'none',
                resize: 'vertical',
                minHeight: '100px',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#E50914')}
              onBlur={e => (e.currentTarget.style.borderColor = '#333333')}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '0.5rem',
                background: '#2B2B2B',
                border: 'none',
                color: '#CCCCCC',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.65rem 1.4rem',
                borderRadius: '0.5rem',
                background: '#E50914',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 15px rgba(229, 9, 20, 0.35)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Saving…
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Post Comment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
