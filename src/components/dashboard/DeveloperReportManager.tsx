'use client'

import { useState, useTransition, useEffect } from 'react'
import { ReportItem, developerUpdateReport } from '@/app/actions/reports'
import { AlertTriangle, CheckCircle, Clock, MessageSquare, ShieldAlert, Loader2, Check, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  reports: ReportItem[]
}

export default function DeveloperReportManager({ reports }: Props) {
  const [responseTexts, setResponseTexts] = useState<Record<string, string>>({})
  const [activeReportId, setActiveReportId] = useState<string | null>(null)
  const [pendingReportId, setPendingReportId] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [successId, setSuccessId] = useState<string | null>(null)

  const topReportId = reports?.[0]?.id || ''

  useEffect(() => {
    if (!topReportId) return
    try {
      const stored = localStorage.getItem('appflix_reports_expanded')
      const storedTopId = localStorage.getItem('appflix_reports_top_id')
      
      // If a new report has arrived, force expand view
      if (storedTopId && storedTopId !== topReportId) {
        setIsExpanded(true)
        localStorage.setItem('appflix_reports_expanded', 'true')
        localStorage.setItem('appflix_reports_top_id', topReportId)
      } else {
        if (stored !== null) setIsExpanded(stored === 'true')
        localStorage.setItem('appflix_reports_top_id', topReportId)
      }
    } catch (e) {}
  }, [topReportId])

  function toggleExpanded() {
    const newState = !isExpanded
    setIsExpanded(newState)
    try {
      localStorage.setItem('appflix_reports_expanded', String(newState))
      localStorage.setItem('appflix_reports_top_id', topReportId)
    } catch (e) {}
  }

  if (!reports || reports.length === 0) return null

  function handleSaveResponse(reportId: string) {
    const text = responseTexts[reportId]
    setPendingReportId(reportId)
    startTransition(async () => {
      try {
        await developerUpdateReport(reportId, text)
        setSuccessId(reportId)
        setActiveReportId(null)
        setTimeout(() => setSuccessId(null), 2500)
      } catch (err: any) {
        alert(err?.message || 'Failed to save response.')
      } finally {
        setPendingReportId(null)
      }
    })
  }

  return (
    <div style={{
      background: 'linear-gradient(145deg, #181212 0%, #0D0808 100%)',
      border: '1px solid rgba(239, 68, 68, 0.35)',
      borderRadius: '0.85rem',
      padding: '1.5rem',
      marginBottom: '2.5rem',
      boxShadow: '0 8px 30px rgba(239, 68, 68, 0.08)',
    }}>
      <div 
        onClick={toggleExpanded}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isExpanded ? '1.25rem' : '0', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '0.5rem',
            background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444',
          }}>
            <ShieldAlert size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
              Active Project Reports ({reports.length})
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#AAAAAA', margin: 0 }}>
              Issues flagged by platform users or administrators. Provide an explanation or context for admin review below.
            </p>
          </div>
        </div>
        <div style={{ color: '#AAAAAA', padding: '0.5rem' }}>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reports.map(report => {
          const formattedDate = new Date(report.created_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          })
          const isResolved = report.status === 'resolved'
          const isDismissed = report.status === 'dismissed'
          const isThisPending = isPending && pendingReportId === report.id

          let statusLabel = 'Open'
          let statusBg = 'rgba(239, 68, 68, 0.18)'
          let statusColor = '#EF4444'

          if (isResolved) {
            statusLabel = 'Resolved by Admin'
            statusBg = 'rgba(46, 204, 113, 0.18)'
            statusColor = '#2ECC71'
          } else if (isDismissed) {
            statusLabel = 'Dismissed by Admin'
            statusBg = 'rgba(120, 120, 120, 0.18)'
            statusColor = '#AAAAAA'
          }

          return (
            <div
              key={report.id}
              style={{
                background: '#121212',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '0.75rem',
                padding: '1.25rem',
              }}
            >
              {/* Top Row: App Name & Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#888888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Reported App:
                  </span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', margin: '0.1rem 0 0 0' }}>
                    {report.projects?.name || 'Project'}
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 800, padding: '0.25rem 0.65rem',
                    borderRadius: '9999px', background: statusBg, color: statusColor,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                  }}>
                    {statusLabel}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#666' }}>
                    {formattedDate}
                  </span>
                </div>
              </div>

              {/* Report Reason */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '0.5rem',
                padding: '0.85rem 1rem',
                marginBottom: '1rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#E50914', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                  <AlertTriangle size={14} /> Reason: {report.details || report.reason}
                </div>
              </div>

              {/* Developer Response Display */}
              {report.developer_response && (
                <div style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: '0.5rem',
                  padding: '0.85rem 1rem',
                  marginBottom: '1rem',
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#60A5FA', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                    Your Response to Admin:
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#FFFFFF', margin: 0, lineHeight: 1.45 }}>
                    {report.developer_response}
                  </p>
                </div>
              )}

              {/* Response Textarea inline */}
              {activeReportId === report.id && (
                <div style={{ marginBottom: '1rem' }}>
                  <textarea
                    rows={2}
                    value={responseTexts[report.id] ?? (report.developer_response || '')}
                    onChange={e => setResponseTexts({ ...responseTexts, [report.id]: e.target.value })}
                    placeholder="Type an explanation or context for the admin review..."
                    style={{
                      width: '100%', padding: '0.75rem', background: '#1C1C1C',
                      border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '0.5rem',
                      color: '#FFFFFF', fontSize: '0.85rem', outline: 'none', resize: 'none',
                      boxSizing: 'border-box', marginBottom: '0.5rem',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleSaveResponse(report.id)}
                      disabled={isThisPending}
                      style={{
                        padding: '0.45rem 0.9rem', background: '#E50914', border: 'none',
                        borderRadius: '0.4rem', color: '#FFFFFF', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                      }}
                    >
                      {isThisPending && <Loader2 size={13} className="animate-spin" />}
                      {isThisPending ? 'Saving...' : 'Submit Response to Admin'}
                    </button>
                    <button
                      onClick={() => setActiveReportId(null)}
                      style={{
                        padding: '0.45rem 0.8rem', background: '#262626', border: '1px solid #333',
                        borderRadius: '0.4rem', color: '#AAA', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                {!isResolved && !isDismissed && (
                  <button
                    onClick={() => setActiveReportId(activeReportId === report.id ? null : report.id)}
                    style={{
                      padding: '0.5rem 0.9rem',
                      background: '#262626',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '0.5rem',
                      color: '#FFFFFF',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                  >
                    <MessageSquare size={13} /> {report.developer_response ? 'Edit Response' : 'Respond to Admin'}
                  </button>
                )}

                {successId === report.id && (
                  <span style={{ fontSize: '0.78rem', color: '#2ECC71', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Check size={14} /> Saved!
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
      )}
    </div>
  )
}
