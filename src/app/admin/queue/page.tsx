'use client'

import { useEffect, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { approveProject, rejectProject } from '@/app/actions/admin'
import { CheckCircle, XCircle, Globe, GitBranch, Clock, Loader2, ExternalLink } from 'lucide-react'

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
  categories: { name: string } | null
  profiles: { username: string } | null
}

function ProjectRow({ project, onAction }: { project: PendingProject; onAction: () => void }) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [isPending, startTransition] = useTransition()

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
      background: '#1F1F1F', border: '1px solid #2B2B2B',
      borderRadius: '0.75rem', overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Top row */}
      <div style={{ padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        {/* Icon */}
        <div style={{
          width: '56px', height: '56px', borderRadius: '0.65rem',
          background: '#262626', border: '1px solid #2B2B2B',
          overflow: 'hidden', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {project.icon_url
            ? <img src={project.icon_url} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Globe size={22} style={{ color: '#444' }} />}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF' }}>{project.name}</h3>
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
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', color: '#E50914', textDecoration: 'none' }}>
                <Globe size={11} /> Website
              </a>
            )}
            {project.github_url && (
              <a href={project.github_url} target="_blank" rel="noopener noreferrer" id={`admin-github-${project.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', color: '#E50914', textDecoration: 'none' }}>
                <GitBranch size={11} /> GitHub
              </a>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <button
            id={`approve-btn-${project.id}`}
            onClick={handleApprove}
            disabled={isPending}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.5rem 1rem', background: 'rgba(46,204,113,0.12)',
              border: '1px solid rgba(46,204,113,0.3)', borderRadius: '0.5rem',
              color: '#2ECC71', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
              transition: 'all 0.2s',
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
            }}
          >
            <XCircle size={14} /> Reject
          </button>
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

  async function fetchQueue() {
    const supabase = createClient()
    const { data } = await supabase
      .from('projects')
      .select(`
        id, name, slug, tagline, description, icon_url,
        website_url, github_url, stage, platforms, created_at,
        categories(name), profiles(username)
      `)
      .eq('status', 'pending')
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
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

  return (
    <div style={{ minHeight: '100vh', background: '#141414', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="accent-line" style={{ width: '2rem', marginBottom: '0.5rem' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em' }}>Review Queue</h1>
          <p style={{ color: '#AAAAAA', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            {loading ? 'Loading…' : `${projects.length} project${projects.length !== 1 ? 's' : ''} pending review`}
          </p>
        </div>

        {/* Queue */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '0.75rem' }} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div style={{
            background: '#1F1F1F', border: '1px solid #2B2B2B', borderRadius: '0.75rem',
            padding: '3rem 2rem', textAlign: 'center',
          }}>
            <CheckCircle size={48} style={{ color: '#2ECC71', margin: '0 auto 1rem' }} />
            <h3 style={{ color: '#FFFFFF', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Queue is clear!</h3>
            <p style={{ color: '#AAAAAA', fontSize: '0.875rem' }}>No pending submissions right now.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {projects.map(project => (
              <ProjectRow key={project.id} project={project} onAction={fetchQueue} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
