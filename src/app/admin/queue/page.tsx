'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { approveProject, rejectProject, getPendingProjects } from '@/app/actions/admin'
import { CheckCircle, XCircle, Globe, GitBranch, Clock, Loader2, ExternalLink, Eye } from 'lucide-react'

interface PendingProject {
  id: string
  name: string
  slug: string
  tagline: string
  description: string
  icon_url: string | null
  website_url: string | null
  github_url: string | null
  stage: string
  platforms: string[]
  created_at: string
  approved_at: string | null
  updated_at?: string
  categories: { name: string } | null
  profiles: { username: string } | null
}

function ProjectRow({ project, onAction }: { project: PendingProject; onAction: () => void }) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isEditSubmission = Boolean(project.approved_at)

  function handleApprove() {
    startTransition(async () => {
      await approveProject(project.id)
      onAction()
    })
  }

  function handleReject() {
    if (!rejectionReason.trim()) { alert('Please enter a rejection reason.'); return }
    startTransition(async () => {
      await rejectProject(project.id, rejectionReason)
      onAction()
    })
  }

  const submittedDate = new Date(project.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div style={{
      background: 'linear-gradient(145deg, #0F0F0F 0%, #080808 100%)',
      border: isEditSubmission ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(59, 130, 246, 0.4)',
      borderRadius: '0.75rem', overflow: 'hidden',
      transition: 'border-color 0.2s',
      boxShadow: isEditSubmission ? '0 4px 20px rgba(168, 85, 247, 0.08)' : '0 4px 20px rgba(59, 130, 246, 0.08)',
    }}>
      {/* Type Header Stripe */}
      <div style={{
        padding: '0.4rem 1.25rem',
        background: isEditSubmission ? 'rgba(168, 85, 247, 0.12)' : 'rgba(59, 130, 246, 0.12)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: '0.72rem',
          fontWeight: 800,
          color: isEditSubmission ? '#C084FC' : '#60A5FA',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}>
          {isEditSubmission ? '✏️ EDITED APP — REQUIRES RE-APPROVAL' : '✨ NEW APP SUBMISSION'}
        </span>
        <span style={{ fontSize: '0.72rem', color: '#888888' }}>
          {isEditSubmission ? 'App was previously live & edited' : 'First time submission'}
        </span>
      </div>

      {/* Top row */}
      <div style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        {/* Icon */}
        <Link href={`/browse/${project.slug}`} target="_blank" style={{ textDecoration: 'none' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '0.65rem',
            background: '#161616', border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            {project.icon_url
              ? <img src={project.icon_url} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Globe size={22} style={{ color: '#444' }} />}
          </div>
        </Link>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
            <Link href={`/browse/${project.slug}`} target="_blank" style={{ textDecoration: 'none', color: '#FFFFFF' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                {project.name}
                <ExternalLink size={14} style={{ color: '#E50914' }} />
              </h3>
            </Link>

            {project.categories && (
              <span style={{
                fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem',
                background: 'rgba(229,9,20,0.12)', color: '#E50914', borderRadius: '9999px',
              }}>
                {project.categories.name}
              </span>
            )}
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem',
              background: project.stage === 'production' ? 'rgba(46,204,113,0.1)' : 'rgba(243,156,18,0.1)',
              color: project.stage === 'production' ? '#2ECC71' : '#F39C12',
              borderRadius: '9999px', textTransform: 'capitalize',
            }}>
              {project.stage}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#AAAAAA', marginBottom: '0.5rem' }}>{project.tagline}</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {project.profiles?.username && (
              <span style={{ fontSize: '0.78rem', color: '#555' }}>@{project.profiles.username}</span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#555' }}>
              <Clock size={11} /> {submittedDate}
            </span>
            {project.website_url && (
              <a href={project.website_url} target="_blank" rel="noopener noreferrer" id={`admin-website-${project.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', color: '#888', textDecoration: 'none' }}>
                <Globe size={11} /> Website
              </a>
            )}
            {project.github_url && (
              <a href={project.github_url} target="_blank" rel="noopener noreferrer" id={`admin-github-${project.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', color: '#888', textDecoration: 'none' }}>
                <GitBranch size={11} /> GitHub
              </a>
            )}
          </div>
        </div>

        {/* Action buttons column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'stretch', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              id={`approve-btn-${project.id}`}
              onClick={handleApprove}
              disabled={isPending}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1rem', background: 'rgba(46,204,113,0.12)',
                border: '1px solid rgba(46,204,113,0.3)', borderRadius: '0.5rem',
                color: '#2ECC71', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                transition: 'all 0.2s', flex: 1, justifyContent: 'center',
              }}
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Approve
            </button>
            <button
              id={`reject-btn-${project.id}`}
              onClick={() => setShowReject(!showReject)}
              disabled={isPending}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1rem', background: 'rgba(229,9,20,0.08)',
                border: '1px solid rgba(229,9,20,0.2)', borderRadius: '0.5rem',
                color: '#E50914', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                flex: 1, justifyContent: 'center',
              }}
            >
              <XCircle size={14} /> Reject
            </button>
          </div>

          {/* View App Details Page Button under Approve & Reject */}
          <Link
            href={`/browse/${project.slug}`}
            target="_blank"
            id={`admin-view-details-${project.id}`}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
              fontSize: '0.78rem', fontWeight: 700, color: '#FFFFFF',
              background: 'rgba(229, 9, 20, 0.2)', border: '1px solid #E50914',
              padding: '0.4rem 0.75rem', borderRadius: '0.4rem',
              textDecoration: 'none', transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
          >
            <Eye size={13} style={{ color: '#E50914' }} /> View App Details Page ↗
          </Link>
        </div>
      </div>

      {/* Description preview */}
      {project.description && (
        <div style={{
          borderTop: '1px solid #2B2B2B',
          padding: '0.75rem 1.25rem',
          fontSize: '0.82rem', color: '#777', lineHeight: 1.6,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {project.description}
        </div>
      )}

      {/* Reject reason input */}
      {showReject && (
        <div style={{
          borderTop: '1px solid rgba(229,9,20,0.2)',
          background: 'rgba(229,9,20,0.04)',
          padding: '1rem 1.25rem',
          display: 'flex', gap: '0.75rem', alignItems: 'flex-end',
        }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.78rem', color: '#AAAAAA', display: 'block', marginBottom: '0.35rem' }}>
              Rejection reason (will be shown to the developer)
            </label>
            <textarea
              id={`reject-reason-${project.id}`}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="e.g. Missing description, broken links, off-topic content…"
              rows={2}
              style={{
                width: '100%', padding: '0.6rem 0.85rem',
                background: '#262626', border: '1px solid #2B2B2B',
                borderRadius: '0.4rem', color: '#FFFFFF', fontSize: '0.85rem',
                outline: 'none', resize: 'none', fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            id={`confirm-reject-btn-${project.id}`}
            onClick={handleReject}
            disabled={isPending || !rejectionReason.trim()}
            style={{
              padding: '0.6rem 1.1rem', background: '#E50914',
              color: '#FFFFFF', fontWeight: 600, fontSize: '0.85rem',
              border: 'none', borderRadius: '0.4rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              opacity: rejectionReason.trim() ? 1 : 0.4,
            }}
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            Confirm
          </button>
        </div>
      )}
    </div>
  )
}

export default function AdminQueuePage() {
  const [projects, setProjects] = useState<PendingProject[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [filter, setFilter] = useState<'all' | 'new' | 'edited'>('all')

  async function fetchQueue() {
    const data = await getPendingProjects()
    setProjects((data as unknown as PendingProject[]) ?? [])
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
      fetchQueue()
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

  const newAppsCount = projects.filter(p => !p.approved_at).length
  const editedAppsCount = projects.filter(p => Boolean(p.approved_at)).length

  const filteredProjects = projects.filter(p => {
    if (filter === 'new') return !p.approved_at
    if (filter === 'edited') return Boolean(p.approved_at)
    return true
  })

  return (
    <div style={{ minHeight: '100vh', background: '#141414', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Navigation Tabs between Queue and Reports */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid #2B2B2B', paddingBottom: '0.75rem' }}>
          <Link
            href="/admin/queue"
            style={{
              padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700,
              textDecoration: 'none', color: '#FFFFFF', background: '#E50914',
            }}
          >
            App Review Queue ({projects.length})
          </Link>
          <Link
            href="/admin/reports"
            style={{
              padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 700,
              textDecoration: 'none', color: '#AAAAAA', background: 'transparent',
            }}
          >
            Reports Queue
          </Link>
        </div>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="accent-line" style={{ width: '2rem', marginBottom: '0.5rem' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em' }}>Review Queue</h1>
          <p style={{ color: '#AAAAAA', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {loading ? 'Loading…' : `${projects.length} app${projects.length !== 1 ? 's' : ''} pending review`}
          </p>

          {/* Filter Pills */}
          {!loading && projects.length > 0 && (
            <div style={{ display: 'flex', gap: '0.65rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              <button
                id="filter-all-btn"
                onClick={() => setFilter('all')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: filter === 'all' ? '1px solid #E50914' : '1px solid #2B2B2B',
                  background: filter === 'all' ? '#E50914' : '#1F1F1F',
                  color: '#FFFFFF',
                  transition: 'all 0.2s',
                }}
              >
                All Pending ({projects.length})
              </button>

              <button
                id="filter-new-btn"
                onClick={() => setFilter('new')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: filter === 'new' ? '1px solid #3B82F6' : '1px solid #2B2B2B',
                  background: filter === 'new' ? 'rgba(59, 130, 246, 0.2)' : '#1F1F1F',
                  color: filter === 'new' ? '#60A5FA' : '#CCCCCC',
                  transition: 'all 0.2s',
                }}
              >
                ✨ New Apps ({newAppsCount})
              </button>

              <button
                id="filter-edited-btn"
                onClick={() => setFilter('edited')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: filter === 'edited' ? '1px solid #A855F7' : '1px solid #2B2B2B',
                  background: filter === 'edited' ? 'rgba(168, 85, 247, 0.2)' : '#1F1F1F',
                  color: filter === 'edited' ? '#C084FC' : '#CCCCCC',
                  transition: 'all 0.2s',
                }}
              >
                ✏️ Edited Apps ({editedAppsCount})
              </button>
            </div>
          )}
        </div>

        {/* Queue */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '0.75rem' }} />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div style={{
            background: 'linear-gradient(145deg, #0F0F0F 0%, #080808 100%)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '0.75rem',
            padding: '3rem 2rem', textAlign: 'center',
          }}>
            <CheckCircle size={48} style={{ color: '#2ECC71', margin: '0 auto 1rem' }} />
            <h3 style={{ color: '#FFFFFF', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>No apps in this category</h3>
            <p style={{ color: '#AAAAAA', fontSize: '0.875rem' }}>All pending apps in this filter view have been processed.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredProjects.map(project => (
              <ProjectRow key={project.id} project={project} onAction={fetchQueue} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
