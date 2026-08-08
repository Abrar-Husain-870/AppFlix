'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { getSupportInquiries, toggleInquiryStatus, deleteInquiry } from '@/app/actions/admin'
import {
  Mail, CheckCircle2, Clock, Trash2, Search, ExternalLink,
  Shield, AlertCircle, RefreshCw, MessageSquare, Copy, Check
} from 'lucide-react'

interface Inquiry {
  id: string
  name: string | null
  email: string
  message: string
  recipient_email: string | null
  status: string
  created_at: string
}

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'resolved'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isPending, startTransition] = useTransition()
  const [copiedEmailId, setCopiedEmailId] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getSupportInquiries()
      setInquiries(data as Inquiry[])
    } catch (err) {
      console.error('Failed to load support inquiries:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email)
    setCopiedEmailId(id)
    setTimeout(() => setCopiedEmailId(null), 2500)
  }

  const handleToggleStatus = (id: string, currentStatus: string) => {
    startTransition(async () => {
      await toggleInquiryStatus(id, currentStatus)
      loadData()
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this support inquiry?')) return
    startTransition(async () => {
      await deleteInquiry(id)
      loadData()
    })
  }

  // Filtering
  const filteredInquiries = inquiries.filter(item => {
    const matchesFilter =
      filter === 'all' ? true :
      filter === 'unread' ? item.status !== 'resolved' :
      item.status === 'resolved'

    const matchesSearch =
      searchQuery.trim() === '' ||
      (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.message.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesFilter && matchesSearch
  })

  const unreadCount = inquiries.filter(i => i.status !== 'resolved').length
  const resolvedCount = inquiries.filter(i => i.status === 'resolved').length

  return (
    <main style={{ minHeight: '100vh', background: '#141414', padding: '2.5rem 1.5rem 5rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Admin Navigation Bar Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '2rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '1rem',
          flexWrap: 'wrap',
        }}>
          <Link
            href="/admin/queue"
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '0.5rem',
              color: '#AAAAAA',
              background: 'rgba(255, 255, 255, 0.05)',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Shield size={16} /> Moderation Queue
          </Link>

          <Link
            href="/admin/reports"
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '0.5rem',
              color: '#AAAAAA',
              background: 'rgba(255, 255, 255, 0.05)',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} /> Reports
          </Link>

          <Link
            href="/admin/inquiries"
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '0.5rem',
              color: '#FFFFFF',
              background: '#E50914',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 16px rgba(229, 9, 20, 0.35)',
            }}
          >
            <MessageSquare size={16} /> Support Inquiries ({unreadCount})
          </Link>
        </div>

        {/* Page Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}>
          <div>
            <h1 style={{
              fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
              fontWeight: 900,
              color: '#FFFFFF',
              margin: '0 0 0.4rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}>
              <Mail size={32} style={{ color: '#E50914' }} /> Support &amp; Feedback Inbox
            </h1>
            <p style={{ color: '#AAAAAA', fontSize: '0.9rem', margin: 0 }}>
              Manage student inquiries, feedback, bug reports, and direct replies.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            style={{
              padding: '0.6rem 1rem',
              background: '#222222',
              border: '1px solid #333333',
              borderRadius: '0.4rem',
              color: '#CCCCCC',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <RefreshCw size={15} /> Refresh Inbox
          </button>
        </div>

        {/* Filters and Search Toolbar */}
        <div style={{
          background: '#181818',
          border: '1px solid #2B2B2B',
          borderRadius: '0.75rem',
          padding: '1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setFilter('all')}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '0.4rem',
                border: 'none',
                background: filter === 'all' ? '#333333' : 'transparent',
                color: filter === 'all' ? '#FFFFFF' : '#888888',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              All ({inquiries.length})
            </button>

            <button
              type="button"
              onClick={() => setFilter('unread')}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '0.4rem',
                border: 'none',
                background: filter === 'unread' ? 'rgba(229, 9, 20, 0.2)' : 'transparent',
                color: filter === 'unread' ? '#E50914' : '#888888',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Pending ({unreadCount})
            </button>

            <button
              type="button"
              onClick={() => setFilter('resolved')}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '0.4rem',
                border: 'none',
                background: filter === 'resolved' ? 'rgba(46, 204, 113, 0.2)' : 'transparent',
                color: filter === 'resolved' ? '#2ECC71' : '#888888',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Resolved ({resolvedCount})
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '340px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              type="text"
              placeholder="Search sender, email, query..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.85rem 0.5rem 2.4rem',
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: '0.4rem',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#888888' }}>
            <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem', color: '#E50914' }} />
            <p>Loading support inquiries...</p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          /* Empty State */
          <div style={{
            background: '#181818',
            border: '1px solid #2B2B2B',
            borderRadius: '0.75rem',
            padding: '4rem 2rem',
            textAlign: 'center',
            color: '#888888',
          }}>
            <CheckCircle2 size={48} style={{ color: '#2ECC71', marginBottom: '1rem' }} />
            <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', margin: '0 0 0.5rem' }}>No Inquiries Found</h3>
            <p style={{ fontSize: '0.9rem', margin: 0 }}>
              {filter === 'unread' ? 'All support queries have been resolved!' : 'No inquiries match your current filter.'}
            </p>
          </div>
        ) : (
          /* Inquiry List */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {filteredInquiries.map(inquiry => {
              const isResolved = inquiry.status === 'resolved'
              const isCopied = copiedEmailId === inquiry.id
              const dateStr = new Date(inquiry.created_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })

              return (
                <div
                  key={inquiry.id}
                  style={{
                    background: '#181818',
                    border: isResolved ? '1px solid #2B2B2B' : '1px solid rgba(229, 9, 20, 0.4)',
                    borderRadius: '0.75rem',
                    padding: '1.5rem',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                    position: 'relative',
                  }}
                >
                  {/* Inquiry Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    marginBottom: '1rem',
                    borderBottom: '1px solid #262626',
                    paddingBottom: '1rem',
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                          {inquiry.name || 'Anonymous Student'}
                        </h3>
                        {/* Status Badge */}
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '0.3rem',
                          background: isResolved ? 'rgba(46, 204, 113, 0.15)' : 'rgba(229, 9, 20, 0.15)',
                          color: isResolved ? '#2ECC71' : '#E50914',
                          border: isResolved ? '1px solid rgba(46, 204, 113, 0.3)' : '1px solid rgba(229, 9, 20, 0.3)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}>
                          {isResolved ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          {isResolved ? 'Resolved' : 'Pending Inquiry'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', color: '#AAAAAA', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Mail size={14} style={{ color: '#E50914' }} /> {inquiry.email}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCopyEmail(inquiry.email, inquiry.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#777777',
                            cursor: 'pointer',
                            padding: '2px 6px',
                            borderRadius: '3px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.75rem',
                          }}
                          title="Copy Email"
                        >
                          {isCopied ? <Check size={12} style={{ color: '#2ECC71' }} /> : <Copy size={12} />}
                          {isCopied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#666666', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={14} /> {dateStr}
                    </div>
                  </div>

                  {/* Message Content Box */}
                  <div style={{
                    background: '#111111',
                    border: '1px solid #262626',
                    borderRadius: '0.5rem',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.25rem',
                    color: '#DDDDDD',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-line',
                  }}>
                    {inquiry.message}
                  </div>

                  {/* Action Buttons Toolbar */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}>
                    <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                      {/* Mark Resolved / Pending Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(inquiry.id, inquiry.status)}
                        disabled={isPending}
                        style={{
                          padding: '0.55rem 1rem',
                          background: isResolved ? '#262626' : '#2ECC71',
                          color: isResolved ? '#AAAAAA' : '#000000',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          border: 'none',
                          borderRadius: '0.4rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          transition: 'opacity 0.2s',
                        }}
                      >
                        <CheckCircle2 size={15} />
                        {isResolved ? 'Mark as Pending' : 'Mark as Resolved'}
                      </button>

                      {/* Reply via Gmail Web (Primary Action) */}
                      <a
                        href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(inquiry.email)}&su=${encodeURIComponent(`Re: Your AppFlix Support Inquiry`)}&body=${encodeURIComponent(`Hi ${inquiry.name || 'there'},\n\nThank you for reaching out to AppFlix!\n\nRegarding your inquiry:\n"${inquiry.message}"\n\n`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          if (!isResolved) {
                            handleToggleStatus(inquiry.id, inquiry.status)
                          }
                        }}
                        style={{
                          padding: '0.55rem 1.1rem',
                          background: '#E50914',
                          border: 'none',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          borderRadius: '0.4rem',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          boxShadow: '0 4px 14px rgba(229, 9, 20, 0.3)',
                        }}
                      >
                        <ExternalLink size={15} /> Reply via Gmail Web ↗
                      </a>
                    </div>

                    {/* Delete Inquiry */}
                    <button
                      type="button"
                      onClick={() => handleDelete(inquiry.id)}
                      disabled={isPending}
                      style={{
                        padding: '0.55rem 0.85rem',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#EF4444',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        borderRadius: '0.4rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
