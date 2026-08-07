import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import UpvoteButton from '@/components/projects/UpvoteButton'
import BookmarkButton from '@/components/projects/BookmarkButton'
import ExternalLinkButton from '@/components/projects/ExternalLinkButton'
import ViewTracker from '@/components/projects/ViewTracker'
import { Globe, GitBranch, Calendar, Tag, Monitor, Smartphone, Pencil, ExternalLink, ArrowUpRight } from 'lucide-react'
import ProductGallery from '@/components/projects/ProductGallery'
import AdminDeleteButton from '@/components/admin/AdminDeleteButton'
import ReportModal from '@/components/projects/ReportModal'
import type { Metadata } from 'next'
import ShareCard from '@/components/projects/ShareCard'
import ProjectCommentsSection from '@/components/projects/ProjectCommentsSection'
import { getProjectComments } from '@/app/actions/comments'

/** Parse User-Agent string into the device_type enum values used by the DB. */
function detectDeviceType(ua: string | null): 'mobile' | 'tablet' | 'desktop' {
  if (!ua) return 'desktop'
  const s = ua.toLowerCase()
  if (/tablet|ipad|playbook|silk|(android(?!.*mobile))/.test(s)) return 'tablet'
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop|windows phone/.test(s)) return 'mobile'
  return 'desktop'
}

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
      profiles!user_id(username, display_name, avatar_url),
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
    const { data: profile } = await supabaseService.from('profiles').select('role').eq('id', user.id).single()
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

  // Detect device type server-side from User-Agent (passed to ViewTracker as prop)
  const headersList = await headers()
  const userAgent = headersList.get('user-agent')
  const deviceType = detectDeviceType(userAgent)

  // Fetch comments for this project
  const initialComments = await getProjectComments(project.id)

  const screenshots = (project.project_images as any[])
    ?.filter((img: any) => img.image_type === 'screenshot')
    ?.sort((a: any, b: any) => a.display_order - b.display_order) ?? []

  const submittedDate = new Date(project.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#141414' }}>
      {/* View event tracker — fires client-side with proper visitor_id */}
      <ViewTracker projectId={project.id} deviceType={deviceType} />
      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(229,9,20,0.06) 0%, #141414 100%)',
        borderBottom: '1px solid #2B2B2B',
        padding: '2.5rem 1.5rem',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {project.status !== 'approved' && (
            <div style={{
              background: project.status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(243, 156, 18, 0.15)',
              border: project.status === 'rejected' ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(243, 156, 18, 0.35)',
              borderRadius: '0.75rem',
              padding: '1rem 1.25rem',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    color: project.status === 'rejected' ? '#EF4444' : '#F39C12',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}>
                    {project.status === 'rejected' ? '❌ App Rejected' : '⏳ Pending Review'}
                  </span>
                  {isAdmin && (
                    <span style={{ fontSize: '0.7rem', background: '#E50914', color: '#FFF', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                      ADMIN PREVIEW
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.85rem', color: '#DDDDDD', margin: '0.25rem 0 0 0' }}>
                  This app is currently status <strong style={{ color: '#FFF' }}>&quot;{project.status}&quot;</strong> and is not yet publicly visible on the browse directory.
                </p>
              </div>

              <Link
                href="/admin/queue"
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  background: '#262626',
                  border: '1px solid #333333',
                  padding: '0.45rem 0.9rem',
                  borderRadius: '0.4rem',
                  textDecoration: 'none',
                }}
              >
                Go to Admin Queue →
              </Link>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap', position: 'relative' }}>
          {/* Mobile-only pinned Top-Right Actions (Upvote on top, Bookmark below) */}
          <div className="mobile-only" style={{ position: 'absolute', top: 0, right: 0, zIndex: 10, flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
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
          </div>

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
          <div className="details-actions-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', minWidth: '120px' }}>
            {/* Desktop-only Upvote & Bookmark Buttons in sidebar */}
            <div className="desktop-only" style={{ flexDirection: 'column', gap: '0.6rem' }}>
              <UpvoteButton
                projectId={project.id}
                initialCount={project.upvote_count}
                initialUpvoted={isUpvoted}
                requireAuth={!user}
                variant="desktop"
              />
              <BookmarkButton
                projectId={project.id}
                initialBookmarked={isBookmarked}
                requireAuth={!user}
                variant="desktop"
              />
            </div>

            {(!user || user.id !== project.user_id) && (
              <ReportModal
                projectId={project.id}
                appName={project.name}
                requireAuth={!user}
              />
            )}
            {user && project.user_id === user.id && (
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

            {isAdmin && (
              <AdminDeleteButton projectId={project.id} appName={project.name} />
            )}
            {(() => {
              const primaryLink = project.website_url || project.playstore_url || project.appstore_url
              const primaryLabel = project.website_url ? 'Visit Site' : project.playstore_url ? 'Play Store' : project.appstore_url ? 'App Store' : null
              return primaryLink && primaryLabel ? (
                <ExternalLinkButton
                  href={primaryLink}
                  projectId={project.id}
                  id="project-primary-link"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    padding: '0.6rem 1rem', background: '#E50914',
                    color: '#FFFFFF', fontWeight: 600, fontSize: '0.85rem',
                    borderRadius: '0.5rem', textDecoration: 'none',
                    transition: 'background 0.2s', whiteSpace: 'nowrap',
                  }}
                >
                  <ExternalLink size={14} /> {primaryLabel}
                </ExternalLinkButton>
              ) : null
            })()}
          </div>
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

          {/* Customer Reviews & Comments Section */}
          <ProjectCommentsSection
            projectId={project.id}
            slug={project.slug}
            isDeveloper={project.user_id === user?.id}
            isLoggedIn={!!user}
            initialComments={initialComments}
          />
        </div>

        {/* Right sidebar — links + stats */}
        <aside style={{ width: '220px', flexShrink: 0 }}>
          {/* Stats card */}
          <div style={{
            background: 'linear-gradient(145deg, #0F0F0F 0%, #080808 100%)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1rem',
          }}>
            <h3 style={{ fontSize: '0.7rem', fontWeight: 800, color: '#777777', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Stats</h3>
            {[
              { label: 'Upvotes',   value: project.upvote_count },
              { label: 'Views',     value: project.view_count },
              { label: 'Bookmarks', value: project.bookmark_count },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <span style={{ fontSize: '0.82rem', color: '#AAAAAA' }}>{s.label}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF' }}>{s.value ?? 0}</span>
              </div>
            ))}
          </div>

          {/* Links card — website, github, app store, play store */}
          {(project.website_url || project.github_url || project.appstore_url || project.playstore_url) && (
            <div style={{
              background: 'linear-gradient(145deg, #0F0F0F 0%, #080808 100%)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1rem',
            }}>
              <h3 style={{ fontSize: '0.7rem', fontWeight: 800, color: '#777777', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Links</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {project.website_url && (
                  <ExternalLinkButton
                    href={project.website_url}
                    projectId={project.id}
                    id="project-sidebar-website-link"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      fontSize: '0.85rem', color: '#AAAAAA', textDecoration: 'none',
                      padding: '0.45rem 0.6rem', borderRadius: '0.4rem',
                      border: '1px solid #2B2B2B', transition: 'border-color 0.2s, color 0.2s',
                    }}
                  >
                    <Globe size={14} /> Visit Site
                  </ExternalLinkButton>
                )}
                {project.github_url && (
                  <ExternalLinkButton
                    href={project.github_url}
                    projectId={project.id}
                    id="project-github-link"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      fontSize: '0.85rem', color: '#AAAAAA', textDecoration: 'none',
                      padding: '0.45rem 0.6rem', borderRadius: '0.4rem',
                      border: '1px solid #2B2B2B', transition: 'border-color 0.2s, color 0.2s',
                    }}
                  >
                    <GitBranch size={14} /> GitHub Repo
                  </ExternalLinkButton>
                )}
                {project.appstore_url && (
                  <ExternalLinkButton
                    href={project.appstore_url}
                    projectId={project.id}
                    id="project-appstore-link"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      fontSize: '0.85rem', color: '#AAAAAA', textDecoration: 'none',
                      padding: '0.45rem 0.6rem', borderRadius: '0.4rem',
                      border: '1px solid #2B2B2B',
                    }}
                  >
                    <Smartphone size={14} /> App Store
                  </ExternalLinkButton>
                )}
                {project.playstore_url && (
                  <ExternalLinkButton
                    href={project.playstore_url}
                    projectId={project.id}
                    id="project-playstore-link"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      fontSize: '0.85rem', color: '#AAAAAA', textDecoration: 'none',
                      padding: '0.45rem 0.6rem', borderRadius: '0.4rem',
                      border: '1px solid #2B2B2B',
                    }}
                  >
                    <Smartphone size={14} /> Play Store
                  </ExternalLinkButton>
                )}
              </div>
            </div>
          )}

          {/* Share Card */}
          <ShareCard projectName={project.name} projectSlug={project.slug} />

          {/* Owner / Developer */}
          {(project.profiles as any)?.username && (
            <Link
              href={`/developer/${(project.profiles as any).username}`}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div className="dev-card-hover">
                <h3 style={{ fontSize: '0.7rem', fontWeight: 800, color: '#777777', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                  Developer
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #E50914 0%, #B20710 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF', flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(229, 9, 20, 0.3)',
                    overflow: 'hidden',
                  }}>
                    {(project.profiles as any).avatar_url
                      ? <img src={(project.profiles as any).avatar_url} alt={(project.profiles as any).username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (project.profiles as any).username[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontSize: '0.85rem', color: '#FFFFFF', fontWeight: 600,
                      display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {(project.profiles as any).display_name || `@${(project.profiles as any).username}`}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#666' }}>
                      @{(project.profiles as any).username}
                    </span>
                  </div>
                  <ArrowUpRight size={13} style={{ color: '#555', flexShrink: 0 }} />
                </div>
              </div>
            </Link>
          )}
        </aside>
      </div>
    </div>
  )
}
