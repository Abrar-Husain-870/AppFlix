import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Clock, XCircle, FileText, Edit3, Eye } from 'lucide-react'
import DeleteProjectButton from '@/components/projects/DeleteProjectButton'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft:    { label: 'Draft',    color: '#AAAAAA', bg: 'rgba(170,170,170,0.1)', icon: <FileText size={12} /> },
  pending:  { label: 'Pending',  color: '#F39C12', bg: 'rgba(243,156,18,0.1)', icon: <Clock size={12} /> },
  approved: { label: 'Approved', color: '#2ECC71', bg: 'rgba(46,204,113,0.1)', icon: <CheckCircle size={12} /> },
  rejected: { label: 'Rejected', color: '#E50914', bg: 'rgba(229,9,20,0.1)',   icon: <XCircle size={12} /> },
}

export default async function DashboardProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; updated?: string; media_updated?: string }>
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const justSubmitted    = params.submitted     === 'true'
  const justUpdated      = params.updated       === 'true'
  const justMediaUpdated = params.media_updated === 'true'

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, slug, tagline, icon_url, status, upvote_count, view_count, stage, created_at, rejection_reason')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const grouped = {
    approved: projects?.filter(p => p.status === 'approved') ?? [],
    pending:  projects?.filter(p => p.status === 'pending')  ?? [],
    rejected: projects?.filter(p => p.status === 'rejected') ?? [],
    draft:    projects?.filter(p => p.status === 'draft')    ?? [],
  }

  return (
    <div style={{ minHeight: '100vh', background: '#141414', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="accent-line" style={{ width: '2rem', marginBottom: '0.5rem' }} />
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em' }}>My Apps</h1>
            <p style={{ color: '#AAAAAA', fontSize: '0.875rem', marginTop: '0.25rem' }}>Track and manage your submitted apps.</p>
          </div>
          <Link href="/submit" id="dash-submit-btn" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.65rem 1.25rem', background: '#E50914',
            color: '#FFFFFF', fontWeight: 600, fontSize: '0.875rem',
            borderRadius: '0.5rem', textDecoration: 'none',
          }}>
            + Submit New
          </Link>
        </div>

        {/* Banners */}
        {justSubmitted && (
          <div style={{
            background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.3)',
            borderRadius: '0.6rem', padding: '0.85rem 1.1rem',
            color: '#2ECC71', fontSize: '0.875rem', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '0.6rem',
          }}>
            <CheckCircle size={16} />
            App submitted! It&apos;s now in the admin review queue.
          </div>
        )}
        {justUpdated && (
          <div style={{
            background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.3)',
            borderRadius: '0.6rem', padding: '0.85rem 1.1rem',
            color: '#2ECC71', fontSize: '0.875rem', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '0.6rem',
          }}>
            <CheckCircle size={16} />
            App updated successfully! Changes are live.
          </div>
        )}
        {justMediaUpdated && (
          <div style={{
            background: 'rgba(243,156,18,0.1)', border: '1px solid rgba(243,156,18,0.3)',
            borderRadius: '0.6rem', padding: '0.85rem 1.1rem',
            color: '#F39C12', fontSize: '0.875rem', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '0.6rem',
          }}>
            <Clock size={16} />
            Media/URL changes submitted! Your app is pending admin re-approval.
          </div>
        )}

        {/* Empty state */}
        {(!projects || projects.length === 0) && (
          <div style={{
            background: '#1F1F1F', border: '1px solid #2B2B2B',
            borderRadius: '0.75rem', padding: '3rem 2rem', textAlign: 'center',
          }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚀</p>
            <h3 style={{ color: '#FFFFFF', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>No apps submitted yet</h3>
            <p style={{ color: '#AAAAAA', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Submit your first app and get it in front of the community.</p>
            <Link href="/submit" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.65rem 1.5rem', background: '#E50914',
              color: '#FFFFFF', fontWeight: 600, borderRadius: '0.5rem', textDecoration: 'none',
            }}>
              Submit an App
            </Link>
          </div>
        )}

        {/* Project groups */}
        {Object.entries(grouped).map(([status, items]) => {
          if (items.length === 0) return null
          const cfg = STATUS_CONFIG[status]
          return (
            <div key={status} style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ color: cfg.color }}>{cfg.icon}</span>
                <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: cfg.color, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {cfg.label} ({items.length})
                </h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {items.map(project => (
                  <div key={project.id} style={{
                    background: '#1F1F1F', border: '1px solid #2B2B2B',
                    borderRadius: '0.75rem', padding: '1rem 1.25rem',
                    display: 'flex', gap: '1rem', alignItems: 'center',
                    transition: 'border-color 0.2s',
                  }}>
                    {/* Icon */}
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '0.6rem',
                      background: '#262626', border: '1px solid #2B2B2B',
                      overflow: 'hidden', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {project.icon_url
                        ? <img src={project.icon_url} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <FileText size={18} style={{ color: '#444' }} />}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }}>{project.name}</h3>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem',
                          borderRadius: '9999px', background: cfg.bg, color: cfg.color,
                          letterSpacing: '0.04em', textTransform: 'uppercase',
                          display: 'flex', alignItems: 'center', gap: '0.25rem',
                        }}>
                          {cfg.icon}{cfg.label}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '0.82rem', color: '#AAAAAA', marginTop: '0.15rem',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {project.tagline}
                      </p>
                      {project.status === 'rejected' && project.rejection_reason && (
                        <p style={{ fontSize: '0.78rem', color: '#FF6B6B', marginTop: '0.3rem' }}>
                          Reason: {project.rejection_reason}
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: '1.25rem', flexShrink: 0 }}>
                      {[
                        { label: '▲', value: project.upvote_count },
                        { label: <Eye size={12} />, value: project.view_count },
                      ].map((s, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>{s.value ?? 0}</div>
                          <div style={{ fontSize: '0.7rem', color: '#555' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                      {/* View live (approved only) */}
                      {project.status === 'approved' && (
                        <Link href={`/browse/${project.slug}`} id={`view-project-${project.id}`} title="View live"
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '32px', height: '32px', borderRadius: '0.4rem',
                            color: '#AAAAAA', transition: 'all 0.15s',
                            border: '1px solid transparent', textDecoration: 'none',
                          }}
                        >
                          <Eye size={15} />
                        </Link>
                      )}

                      {/* Edit button */}
                      <Link
                        href={`/dashboard/projects/edit/${project.id}`}
                        id={`edit-project-${project.id}`}
                        title="Edit project"
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: '32px', height: '32px', borderRadius: '0.4rem',
                          color: '#AAAAAA', transition: 'all 0.15s',
                          border: '1px solid transparent', textDecoration: 'none',
                        }}
                      >
                        <Edit3 size={15} />
                      </Link>

                      {/* Delete button with confirmation modal */}
                      <DeleteProjectButton projectId={project.id} projectName={project.name} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
