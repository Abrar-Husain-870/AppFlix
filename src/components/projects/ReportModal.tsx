'use client'

import { useState, useTransition } from 'react'
import { Flag, X, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { submitReport } from '@/app/actions/reports'
import { useRouter } from 'next/navigation'

interface ReportModalProps {
  projectId: string
  appName: string
  requireAuth?: boolean
}

const REPORT_CATEGORIES = [
  {
    id: 'copyright',
    label: 'Copyright / Not the Original Developer',
    description: 'Copied projects, stolen source code, re-uploaded apps, impersonation, or users claiming ownership of someone else’s work.',
    badge: 'NEW',
  },
  {
    id: 'spam',
    label: 'Spam / Low Quality',
    description: 'Irrelevant content, placeholder apps, or automated spam submissions.',
  },
  {
    id: 'inappropriate',
    label: 'Inappropriate Content',
    description: 'Offensive language, explicit content, or dangerous code.',
  },
  {
    id: 'broken_link',
    label: 'Broken Links / Not Working',
    description: 'Dead website/repo links or non-functional demo URLs.',
  },
  {
    id: 'misleading',
    label: 'Misleading Information',
    description: 'False claims about features, tech stack, or platform support.',
  },
  {
    id: 'other',
    label: 'Other Issues',
    description: 'Any other platform guideline or safety concern.',
  },
]

export default function ReportModal({ projectId, appName, requireAuth = false }: ReportModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('misleading')
  const [errorMsg, setErrorMsg] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleOpen() {
    if (requireAuth) {
      router.push('/login')
      return
    }
    setIsOpen(true)
    setErrorMsg('')
    setIsSuccess(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCategory) return

    const categoryObj = REPORT_CATEGORIES.find(c => c.id === selectedCategory)
    const reasonLabel = categoryObj ? categoryObj.label : selectedCategory

    setErrorMsg('')
    startTransition(async () => {
      try {
        await submitReport(projectId, reasonLabel)
        setIsSuccess(true)
        setTimeout(() => {
          setIsOpen(false)
          setIsSuccess(false)
        }, 1800)
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to submit report. Please try again.')
      }
    })
  }

  return (
    <>
      <button
        id="open-report-btn"
        onClick={handleOpen}
        title="Report issue with this app"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          gap: '0.4rem',
          padding: '0.6rem 0.9rem',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '0.5rem',
          color: '#888888',
          fontSize: '0.82rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = '#EF4444'
          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)'
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = '#888888'
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
        }}
      >
        <Flag size={13} /> Report
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #161616 0%, #0B0B0B 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '1rem',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9)',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out',
          }}>
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '0.5rem',
                  background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444',
                }}>
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    Report &quot;{appName}&quot;
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#888888', margin: 0 }}>
                    Help us keep AppFlix safe and original.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent', border: 'none', color: '#777', cursor: 'pointer',
                  padding: '0.3rem', borderRadius: '0.3rem', display: 'flex', alignItems: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            {isSuccess ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                <CheckCircle size={48} style={{ color: '#2ECC71', margin: '0 auto 1rem' }} />
                <h4 style={{ color: '#FFFFFF', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                  Report Submitted
                </h4>
                <p style={{ color: '#AAAAAA', fontSize: '0.875rem' }}>
                  Thank you for keeping AppFlix clean. Our admin team will review this report.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                {errorMsg && (
                  <div style={{
                    padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.5rem',
                    color: '#FF6B6B', fontSize: '0.82rem', marginBottom: '1.25rem',
                  }}>
                    {errorMsg}
                  </div>
                )}

                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#CCCCCC', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.04em' }}>
                  SELECT REPORT REASON:
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '280px', overflowY: 'auto', paddingRight: '0.3rem', marginBottom: '1.25rem' }}>
                  {REPORT_CATEGORIES.map(cat => {
                    const isSelected = selectedCategory === cat.id
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        style={{
                          padding: '0.85rem 1rem',
                          background: isSelected ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                          border: isSelected ? '1px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '0.6rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: isSelected ? '#FFFFFF' : '#DDDDDD' }}>
                            {cat.label}
                          </span>
                          {cat.badge && (
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: '4px', background: '#E50914', color: '#FFFFFF' }}>
                              {cat.badge}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.78rem', color: '#888888', marginTop: '0.25rem', lineHeight: 1.4 }}>
                          {cat.description}
                        </p>
                      </div>
                    )
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    style={{
                      padding: '0.6rem 1.25rem', background: '#262626',
                      border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem',
                      color: '#CCCCCC', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    style={{
                      padding: '0.6rem 1.4rem', background: '#EF4444',
                      border: 'none', borderRadius: '0.5rem',
                      color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                      boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    {isPending ? <Loader2 size={14} className="animate-spin" /> : <Flag size={14} />}
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
