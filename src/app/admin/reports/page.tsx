'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { getAdminReportsQueue, adminResolveReport, adminDismissReport, ReportItem } from '@/app/actions/reports'
import AdminDeleteButton from '@/components/admin/AdminDeleteButton'
import { ShieldAlert, CheckCircle, XCircle, ExternalLink, Globe, Loader2, MessageSquare } from 'lucide-react'

function ReportRow({ report, onAction }: { report: ReportItem; onAction: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [actionType, setActionType] = useState<'resolve' | 'dismiss' | null>(null)

  function handleResolve() {
    setActionType('resolve')
    startTransition(async () => {
      try {
        await adminResolveReport(report.id)
        onAction()
      } finally {
        setActionType(null)
      }
    })
  }

  function handleDismiss() {
    setActionType('dismiss')
    startTransition(async () => {
      try {
        await adminDismissReport(report.id)
        onAction()
      } finally {
        setActionType(null)
      }
    })
  }

  const dateReported = new Date(report.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  const isFixed = report.status === 'developer_marked_fixed'
  const isResolved = report.status === 'resolved' || report.status === 'actioned' || report.status === 'reviewed'
  const isDismissed = report.status === 'dismissed'

  return (
    <div style={{
      background: 'linear-gradient(145deg, #0F0F0F 0%, #080808 100%)',
      border: isFixed
        ? '1px solid rgba(243, 156, 18, 0.4)'
        : report.reason.toLowerCase().includes('copyright')
        ? '1px solid rgba(239, 68, 68, 0.4)'
        : '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '0.75rem',
      overflow: 'hidden',
      boxShadow: isFixed ? '0 4px 20px rgba(243, 156, 18, 0.08)' : '0 4px 20px rgba(0, 0, 0, 0.4)',
    }}>
      {/* Top Header Stripe */}
      <div style={{
        padding: '0.45rem 1.25rem',
        background: isFixed ? 'rgba(243, 156, 18, 0.12)' : 'rgba(255, 255, 255, 0.03)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '4px',
            background: isFixed ? '#F39C12' : isResolved ? '#2ECC71' : isDismissed ? '#555555' : '#E50914',
            color: '#FFFFFF', letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            {isFixed ? 'Developer Responded' : isResolved ? 'Resolved' : isDismissed ? 'Dismissed' : 'Open Report'}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#AAAAAA' }}>
            Reported by @{(report.reporter_profile as any)?.username || 'user'} on {dateReported}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Project Icon */}
        {report.projects?.slug && (
          <Link href={`/browse/${report.projects.slug}`} target="_blank" style={{ textDecoration: 'none' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '0.6rem',
              background: '#161616', border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {report.projects.icon_url
                ? <img src={report.projects.icon_url} alt={report.projects.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Globe size={20} style={{ color: '#555' }} />}
            </div>
          </Link>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Project Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              {report.projects?.name || 'Project'}
            </h3>
            {report.projects?.slug && (
              <Link
                href={`/browse/${report.projects.slug}`}
                target="_blank"
                style={{
                  fontSize: '0.78rem', color: '#E50914', textDecoration: 'none', fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                }}
              >
                View App <ExternalLink size={12} />
              </Link>
            )}
          </div>

          {/* Report Reason */}
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '0.5rem',
            padding: '0.75rem 0.9rem',
            marginBottom: '0.75rem',
          }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FF6B6B' }}>
              Reason: {report.details || report.reason}
            </div>
          </div>

          {/* Developer Response Section */}
          {report.developer_response && (
            <div style={{
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              borderRadius: '0.5rem',
              padding: '0.75rem 0.9rem',
              marginBottom: '0.75rem',
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MessageSquare size={12} /> Developer Response:
              </div>
              <p style={{ fontSize: '0.82rem', color: '#FFFFFF', margin: 0, lineHeight: 1.45 }}>
                &quot;{report.developer_response}&quot;
              </p>
            </div>
          )}

          {/* Admin Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            {!isResolved && (
              <button
                onClick={handleResolve}
                disabled={isPending}
                style={{
                  padding: '0.5rem 1rem', background: '#2ECC71', border: 'none', borderRadius: '0.4rem',
                  color: '#FFFFFF', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                }}
              >
                {isPending && actionType === 'resolve' ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                Mark Resolved
              </button>
            )}

            {!isDismissed && (
              <button
                onClick={handleDismiss}
                disabled={isPending}
                style={{
                  padding: '0.5rem 0.9rem', background: '#262626', border: '1px solid #333333', borderRadius: '0.4rem',
                  color: '#CCCCCC', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                }}
              >
                {isPending && actionType === 'dismiss' ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                Dismiss Report
              </button>
            )}

            {/* Admin Delete Project Option */}
            {report.projects?.id && (
              <AdminDeleteButton projectId={report.projects.id} appName={report.projects.name} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [filter, setFilter] = useState<'active' | 'resolved' | 'dismissed' | 'all'>('active')

  async function fetchReports() {
    const data = await getAdminReportsQueue()
    setReports(data)
    setLoading(false)
  }

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = '/login'; return }
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', data.user.id).single()
      if (profile?.role !== 'admin') { setIsAdmin(false); return }
      setIsAdmin(true)
      fetchReports()
    })
  }, [])

  if (isAdmin === false) {
    return (
      <div style={{ minHeight: '100vh', background: '#141414', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</p>
          <h2 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 700 }}>Admin access required</h2>
          <p style={{ color: '#AAAAAA', marginTop: '0.5rem' }}>You don&apos;t have permission to view this page.</p>
        </div>
      </div>
    )
  }

  const activeReports = reports.filter(r => r.status !== 'resolved' && r.status !== 'actioned' && r.status !== 'reviewed' && r.status !== 'dismissed')
  const resolvedReports = reports.filter(r => r.status === 'resolved' || r.status === 'actioned' || r.status === 'reviewed')
  const dismissedReports = reports.filter(r => r.status === 'dismissed')

  const filteredReports = reports.filter(r => {
    if (filter === 'active') return r.status !== 'resolved' && r.status !== 'actioned' && r.status !== 'reviewed' && r.status !== 'dismissed'
    if (filter === 'resolved') return r.status === 'resolved' || r.status === 'actioned' || r.status === 'reviewed'
    if (filter === 'dismissed') return r.status === 'dismissed'
    return true
  })

  return (
    <div style={{ minHeight: '100vh', background: '#141414', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '950px', margin: '0 auto' }}>
        {/* Navigation Tabs between Queue and Reports */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #2B2B2B', paddingBottom: '0.75rem' }}>
          <Link
            href="/admin/queue"
            style={{
              padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700,
              textDecoration: 'none', color: '#AAAAAA', background: 'transparent',
            }}
          >
            App Review Queue
          </Link>
          <Link
            href="/admin/reports"
            style={{
              padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700,
              textDecoration: 'none', color: '#FFFFFF', background: '#E50914',
            }}
          >
            Reports Queue ({activeReports.length})
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="accent-line" style={{ width: '2rem', marginBottom: '0.5rem' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em' }}>Reports Moderation Queue</h1>
          <p style={{ color: '#AAAAAA', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {loading ? 'Loading…' : `${activeReports.length} active report${activeReports.length !== 1 ? 's' : ''} requiring admin review.`}
          </p>

          {/* Filter Pills */}
          {!loading && (
            <div style={{ display: 'flex', gap: '0.65rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              {[
                { id: 'active', label: `Active Queue (${activeReports.length})` },
                { id: 'resolved', label: `Resolved History (${resolvedReports.length})` },
                { id: 'dismissed', label: `Dismissed (${dismissedReports.length})` },
                { id: 'all', label: `All Reports (${reports.length})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as any)}
                  style={{
                    padding: '0.45rem 0.9rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.2s',
                    border: filter === tab.id ? '1px solid #E50914' : '1px solid #2B2B2B',
                    background: filter === tab.id ? '#E50914' : '#1F1F1F',
                    color: '#FFFFFF',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '0.75rem' }} />
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <div style={{
            background: 'linear-gradient(145deg, #0F0F0F 0%, #080808 100%)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '0.75rem',
            padding: '3rem 2rem', textAlign: 'center',
          }}>
            <ShieldAlert size={48} style={{ color: '#2ECC71', margin: '0 auto 1rem' }} />
            <h3 style={{ color: '#FFFFFF', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>No reports in this view</h3>
            <p style={{ color: '#AAAAAA', fontSize: '0.875rem' }}>All reported issues in this view have been processed.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredReports.map(report => (
              <ReportRow key={report.id} report={report} onAction={fetchReports} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
