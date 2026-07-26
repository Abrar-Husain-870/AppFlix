import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import UpvoteButton from '@/components/projects/UpvoteButton'
import BookmarkButton from '@/components/projects/BookmarkButton'
import { Globe, GitBranch, ExternalLink, Calendar, Tag, Monitor, Smartphone, Pencil } from 'lucide-react'
import ProductGallery from '@/components/projects/ProductGallery'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  web:     <Globe size={13} />,
  ios:     <Smartphone size={13} />,
  android: <Smartphone size={13} />,
  desktop: <Monitor size={13} />,
  chrome:  <Globe size={13} />,
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createServiceRoleClient()
  const { data } = await supabase
    .from('projects')
    .select('name, tagline')
    .eq('slug', slug)
    .single()
  if (!data) return { title: 'Project not found' }
  return {
    title: data.name,
    description: data.tagline,
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params
  const supabaseServer = await createServerClient()
  const supabaseService = await createServiceRoleClient()

  // Fetch project with service role client so RLS doesn't hide pending projects from owner/admin preview
  const { data: project } = await supabaseService
    .from('projects')
    .select(`
      id, user_id, name, slug, tagline, description, icon_url,
      website_url, github_url, appstore_url, playstore_url,
      upvote_count, view_count, bookmark_count,
      stage, platforms, status, created_at,
      categories(name, slug),
      profiles!user_id(username),
      project_images(id, image_url, image_type, display_order),
      project_tags(tags(name, slug))
    `)
    .eq('slug', slug)
    .is('deleted_at', null)
    .single()

  if (!project) notFound()

  // Get current user for auth & status permission check
  const { data: { user } } = await supabaseServer.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabaseServer.from('profiles').select('role').eq('id', user.id).single()
    isAdmin = profile?.role === 'admin'
  }

  // If project is not approved, only the project owner or admin can view it
  if (project.status !== 'approved' && project.user_id !== user?.id && !isAdmin) {
    notFound()
  }

  let isUpvoted = false
  let isBookmarked = false

  if (user) {
    const [{ data: upvote }, { data: bookmark }] = await Promise.all([
      supabaseServer.from('upvotes').select('id').eq('project_id', project.id).eq('user_id', user.id).single(),
      supabaseServer.from('bookmarks').select('id').eq('project_id', project.id).eq('user_id', user.id).single(),
    ])
    isUpvoted = !!upvote
    isBookmarked = !!bookmark
  }

  // Log view event (fire-and-forget — don't await)
  supabaseService.from('analytics_events').insert({
    project_id: project.id,
    event_type: 'view',
    user_id: user?.id ?? null,
    visitor_id: user ? null : 'server-render',
  }).then(() => {})

  const screenshots = (project.project_images as any[])
    ?.filter((img: any) => img.image_type === 'screenshot')
    ?.sort((a: any, b: any) => a.display_order - b.display_order) ?? []

  const submittedDate = new Date(project.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#141414' }}>
      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(229,9,20,0.06) 0%, #141414 100%)',
        borderBottom: '1px solid #2B2B2B',
        padding: '2.5rem 1.5rem',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Icon */}
          <div style={{
            width: '80px', height: '80px', borderRadius: '1.1rem',
            background: '#1F1F1F', border: '1px solid #2B2B2B',
            overflow: 'hidden', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {project.icon_url
              ? <img src={project.icon_url} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Globe size={32} style={{ color: '#444' }} />}
          </div>

          {/* Title block */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            {/* Breadcrumb */}
            <p style={{ fontSize: '0.8rem', color: '#555', marginBottom: '0.4rem' }}>
              <Link href="/browse" style={{ color: '#E50914', textDecoration: 'none' }}>Browse</Link>
              {' / '}
              {(project.categories as any)?.name}
            </p>
            <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em', marginBottom: '0.4rem' }}>
              {project.name}
            </h1>
            <p style={{ color: '#AAAAAA', fontSize: '1rem', lineHeight: 1.5, marginBottom: '1rem', maxWidth: '540px' }}>
              {project.tagline}
            </p>

            {/* Meta row */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Stage badge */}
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                padding: '0.25rem 0.65rem', borderRadius: '9999px',
                background: project.stage === 'production' ? 'rgba(46,204,113,0.15)' : 'rgba(243,156,18,0.15)',
                color: project.stage === 'production' ? '#2ECC71' : '#F39C12',
              }}>
                {project.stage}
              </span>

              {/* Platforms */}
              {(project.platforms as string[])?.map((p: string) => (
                <span key={p} style={{
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  fontSize: '0.78rem', color: '#888',
                  background: '#1F1F1F', border: '1px solid #2B2B2B',
                  padding: '0.25rem 0.6rem', borderRadius: '0.35rem',
                  textTransform: 'capitalize',
                }}>
                  {PLATFORM_ICONS[p] ?? null}
                  {p}
                </span>
              ))}

              {/* Date */}
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#555' }}>
                <Calendar size={12} />
                {submittedDate}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', minWidth: '120px' }}>
            <UpvoteButton
              projectId={project.id}
              initialCount={project.upvote_count}
              initialUpvoted={isUpvoted}
              requireAuth={!user}
            />
            <BookmarkButton
              projectId={project.id}
              initialBookmarked={isBookmarked}
              requireAuth={!user}
            />
            {user && (project.user_id === user.id || isAdmin) && (
              <Link
                href={`/dashboard/projects/edit/${project.id}`}
                id="edit-app-btn"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  padding: '0.6rem 1rem', background: '#262626',
                  border: '1px solid rgba(229, 9, 20, 0.5)',
                  color: '#FFFFFF', fontWeight: 600, fontSize: '0.85rem',
                  borderRadius: '0.5rem', textDecoration: 'none',
                  transition: 'all 0.2s', whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(229, 9, 20, 0.15)',
                }}
              >
                <Pencil size={14} style={{ color: '#E50914' }} /> Edit App
              </Link>
            )}
            {project.website_url && (
              <a
                href={project.website_url}
                target="_blank"
                rel="noopener noreferrer"
                id="project-website-link"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  padding: '0.6rem 1rem', background: '#E50914',
                  color: '#FFFFFF', fontWeight: 600, fontSize: '0.85rem',
                  borderRadius: '0.5rem', textDecoration: 'none',
                  transition: 'background 0.2s', whiteSpace: 'nowrap',
                }}
              >
                <ExternalLink size={14} /> Visit Site
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main body */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Left — screenshots + description */}
        <div style={{ flex: 1, minWidth: '280px' }}>

          {/* Screenshots Gallery with Arrows & Lightbox */}
          <ProductGallery screenshots={screenshots} projectName={project.name} />

          {/* Description */}
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.75rem' }}>About</h2>
            <div style={{
              color: '#CCCCCC', fontSize: '0.9rem', lineHeight: 1.75,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {project.description || project.tagline}
            </div>
          </div>

          {/* Tags */}
          {(project.project_tags as any[])?.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Tag size={13} /> Tags
              </h3>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {(project.project_tags as any[]).map((pt: any) => (
                  <span key={pt.tags?.slug} style={{
                    fontSize: '0.78rem', color: '#AAAAAA',
                    background: '#1F1F1F', border: '1px solid #2B2B2B',
                    padding: '0.25rem 0.65rem', borderRadius: '9999px',
                  }}>
                    #{pt.tags?.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar — links + stats */}
        <aside style={{ width: '220px', flexShrink: 0 }}>
          {/* Stats card */}
          <div style={{
            background: '#1F1F1F', border: '1px solid #2B2B2B',
            borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1rem',
          }}>
            <h3 style={{ fontSize: '0.7rem', fontWeight: 700, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Stats</h3>
            {[
              { label: 'Upvotes',   value: project.upvote_count },
              { label: 'Views',     value: project.view_count },
              { label: 'Bookmarks', value: project.bookmark_count },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #2B2B2B' }}>
                <span style={{ fontSize: '0.82rem', color: '#AAAAAA' }}>{s.label}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>{s.value ?? 0}</span>
              </div>
            ))}
          </div>

          {/* Links card */}
          {(project.github_url || project.appstore_url || project.playstore_url) && (
            <div style={{
              background: '#1F1F1F', border: '1px solid #2B2B2B',
              borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1rem',
            }}>
              <h3 style={{ fontSize: '0.7rem', fontWeight: 700, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Links</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {project.github_url && (
                  <a href={project.github_url} target="_blank" rel="noopener noreferrer" id="project-github-link" style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    fontSize: '0.85rem', color: '#AAAAAA', textDecoration: 'none',
                    padding: '0.45rem 0.6rem', borderRadius: '0.4rem',
                    border: '1px solid #2B2B2B', transition: 'border-color 0.2s, color 0.2s',
                  }}>
                    <GitBranch size={14} /> GitHub Repo
                  </a>
                )}
                {project.appstore_url && (
                  <a href={project.appstore_url} target="_blank" rel="noopener noreferrer" id="project-appstore-link" style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    fontSize: '0.85rem', color: '#AAAAAA', textDecoration: 'none',
                    padding: '0.45rem 0.6rem', borderRadius: '0.4rem',
                    border: '1px solid #2B2B2B',
                  }}>
                    <Smartphone size={14} /> App Store
                  </a>
                )}
                {project.playstore_url && (
                  <a href={project.playstore_url} target="_blank" rel="noopener noreferrer" id="project-playstore-link" style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    fontSize: '0.85rem', color: '#AAAAAA', textDecoration: 'none',
                    padding: '0.45rem 0.6rem', borderRadius: '0.4rem',
                    border: '1px solid #2B2B2B',
                  }}>
                    <Smartphone size={14} /> Play Store
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Maker */}
          {(project.profiles as any)?.username && (
            <div style={{
              background: '#1F1F1F', border: '1px solid #2B2B2B',
              borderRadius: '0.75rem', padding: '1.25rem',
            }}>
              <h3 style={{ fontSize: '0.7rem', fontWeight: 700, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Maker</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: '#E50914', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', flexShrink: 0,
                }}>
                  {(project.profiles as any).username[0].toUpperCase()}
                </div>
                <span style={{ fontSize: '0.875rem', color: '#FFFFFF', fontWeight: 500 }}>
                  @{(project.profiles as any).username}
                </span>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
