'use client'

import { useState, useEffect } from 'react'
import { X, Mail, Send, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react'
import { submitContactInquiry } from '@/app/actions/contact'

export default function ContactUsModal({
  isOpen,
  onClose,
  initialEmail = '',
}: {
  isOpen: boolean
  onClose: () => void
  initialEmail?: string
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState(initialEmail)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Sync initialEmail when passed from footer CTA
  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail)
    }
  }, [initialEmail])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !message.trim()) return

    try {
      setSubmitting(true)
      await submitContactInquiry({
        name,
        email,
        message,
      })
      setSubmitted(true)
      setTimeout(() => {
        setSubmitted(false)
        onClose()
        setName('')
        setEmail('')
        setMessage('')
      }, 2200)
    } catch (err) {
      console.error('Failed to submit contact inquiry:', err)
    } finally {
      setSubmitting(false)
    }
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
      padding: '1.5rem',
    }}>
      <div style={{
        background: '#181818',
        border: '1px solid #333333',
        borderRadius: '0.75rem',
        width: '100%',
        maxWidth: '540px',
        padding: '2.25rem',
        boxSizing: 'border-box',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)',
      }}>
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <CheckCircle2 size={54} style={{ color: '#2ECC71', marginBottom: '1rem' }} />
            <h3 style={{ color: '#FFFFFF', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.5rem' }}>
              Message Received!
            </h3>
            <p style={{ color: '#AAAAAA', fontSize: '0.9rem', margin: 0 }}>
              The AppFlix team will respond to your email shortly.
            </p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '4px', height: '22px', background: '#E50914', borderRadius: '2px' }} />
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Contact AppFlix Team
              </h3>
            </div>

            {/* Support Info Banner */}
            <div style={{
              background: 'rgba(229, 9, 20, 0.12)',
              border: '1px solid rgba(229, 9, 20, 0.3)',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              fontSize: '0.85rem',
              color: '#DDDDDD',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Mail size={15} style={{ color: '#E50914' }} />
                <span><strong>Direct Support Email:</strong> husainabrar870@gmail.com</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ShieldCheck size={15} style={{ color: '#E50914' }} />
                <span><strong>Developer Support:</strong> Direct response from AppFlix Creator within 24h</span>
              </div>
            </div>

            {/* Contact Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#AAAAAA', marginBottom: '0.35rem' }}>Your Name (Optional)</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: '#111111',
                    border: '1px solid #333333',
                    borderRadius: '0.4rem',
                    color: '#FFFFFF',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#AAAAAA', marginBottom: '0.35rem' }}>Your Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@university.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: '#111111',
                    border: '1px solid #333333',
                    borderRadius: '0.4rem',
                    color: '#FFFFFF',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#AAAAAA', marginBottom: '0.35rem' }}>How can we help you?</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your inquiry, feedback, or issue..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: '#111111',
                    border: '1px solid #333333',
                    borderRadius: '0.4rem',
                    color: '#FFFFFF',
                    fontSize: '0.9rem',
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.85rem',
                  background: submitting ? '#990000' : '#E50914',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '0.4rem',
                  fontSize: '0.95rem',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = '#F40612' }}
                onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = '#E50914' }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending Message...
                  </>
                ) : (
                  <>
                    <Send size={16} /> Send Message to Team
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
