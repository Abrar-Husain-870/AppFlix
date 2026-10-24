import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import UpvoteButton from '@/components/projects/UpvoteButton'
import AppIcon from '@/components/ui/AppIcon'
import BookmarkButton from '@/components/projects/BookmarkButton'
import ExternalLinkButton from '@/components/projects/ExternalLinkButton'
import ViewTracker from '@/components/projects/ViewTracker'
import { Globe, GitBranch, Calendar, Tag, Monitor, Smartphone, Pencil, ExternalLink, ArrowUpRight, Link2, Eye, Star, ChevronRight, FolderOpen, Apple, Bot, Terminal } from 'lucide-react'
import ProductGallery from '@/components/projects/ProductGallery'
import AdminDeleteButton from '@/components/admin/AdminDeleteButton'
import ReportModal from '@/components/projects/ReportModal'
import { PrivateFeedbackButton } from '@/components/projects/PrivateFeedbackModal'
import type { Metadata } from 'next'
import ShareCard from '@/components/projects/ShareCard'
import ProjectCommentsSection from '@/components/projects/ProjectCommentsSection'
import { getProjectComments } from '@/app/actions/comments'

/** Authentic Windows 4-pane icon */
function WindowsIcon({ size = 13, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.949-1.801" />
    </svg>
  )
}

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
      listing_type, listing_paid, listing_expires_at,
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

  const isOwnerOrAdmin = user && (project.user_id === user.id || isAdmin)

  // If project is not approved, only the project owner or admin can view it
  if (project.status !== 'approved' && !isOwnerOrAdmin) {
    notFound()
  }

  // Check Plus listing visibility for public visitors
  const isPaidListingActive = project.listing_type === 'paid' &&
    project.listing_paid === true &&
    project.listing_expires_at &&
    new Date(project.listing_expires_at) > new Date()

  const isPubliclyVisible = project.listing_type === 'free' || isPaidListingActive

  if (!isPubliclyVisible && !isOwnerOrAdmin) {
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

  // Calculate average rating & reviews count from initialComments
  const reviewsCount = initialComments.length
  const avgRating = reviewsCount > 0
    ? (initialComments.reduce((acc, c) => acc + (c.rating ?? 5), 0) / reviewsCount).toFixed(1)
    : null

  // Fetch developer's total approved apps count
  let devAppsCount = 1
  if (project.user_id) {
    const { count } = await supabaseService
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', project.user_id)
      .eq('status', 'approved')
      .is('deleted_at', null)
    if (count) devAppsCount = count
  }

  function formatCount(num: number | null | undefined): string {
    if (!num) return '0'
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K'
    return num.toString()
  }

  const screenshots = (project.project_images as any[])
    ?.filter((img: any) => img.image_type === 'screenshot')
    ?.sort((a: any, b: any) => a.display_order - b.display_order) ?? []

  const submittedDate = new Date(project.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#080808', width: '100%', maxWidth: '100vw', overflowX: 'clip' }}>
      {/* View event tracker — fires client-side with proper visitor_id */}
      <ViewTracker projectId={project.id} deviceType={deviceType} />
      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(229,9,20,0.06) 0%, #080808 100%)',
        borderBottom: '1px solid #2B2B2B',
        padding: '2.5rem 1.5rem',
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'clip',
        boxSizing: 'border-box',
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

          {/* Icon */}
          <AppIcon
            src={project.icon_url}
            alt={project.name}
            size={80}
            fallbackText={project.name}
          />

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

            {/* Meta row: Stage, Category, Tags (without hashtags), Date */}
            <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Stage badge */}
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                padding: '0.22rem 0.6rem', borderRadius: '9999px',
                background: project.stage === 'production' ? 'rgba(46,204,113,0.15)' : 'rgba(243,156,18,0.15)',
                color: project.stage === 'production' ? '#2ECC71' : '#F39C12',
              }}>
                {project.stage}
              </span>

              {/* Category */}
              {(project.categories as any)?.name && (
                <Link
                  href={`/browse?category=${(project.categories as any)?.slug || ''}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    background: 'rgba(229, 9, 20, 0.16)',
                    border: '1px solid rgba(229, 9, 20, 0.45)',
                    padding: '0.22rem 0.55rem',
                    borderRadius: '0.35rem',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {(project.categories as any).name}
                </Link>
              )}

              {/* Tags without hashtags */}
              {(project.project_tags as any[])?.map((pt: any) => {
                const tagName = pt.tags?.name
                const tagSlug = pt.tags?.slug
                if (!tagName) return null
                return (
                  <span
                    key={tagSlug || tagName}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontSize: '0.74rem',
                      fontWeight: 500,
                      color: '#D4D4D8',
                      background: '#1F1F1F',
                      border: '1px solid #2B2B2B',
                      padding: '0.22rem 0.55rem',
                      borderRadius: '0.35rem',
                    }}
                  >
                    {tagName}
                  </span>
                )
              })}

              {/* Date */}
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#666' }}>
                <Calendar size={12} />
                {submittedDate}
              </span>
            </div>
          </div>

          {/* Actions - 2-Tier Layout matching Image 2 */}
          <div className="details-actions-container" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            width: '360px',
            maxWidth: '100%',
            flexShrink: 0,
          }}>
            {/* Top Row: Primary Red Buttons (Upvote + Open App) */}
            <div style={{ display: 'flex', gap: '0.65rem', width: '100%' }}>
              <UpvoteButton
                projectId={project.id}
                initialCount={project.upvote_count}
                initialUpvoted={isUpvoted}
                requireAuth={!user}
                variant="hero"
              />

              {(() => {
                const primaryLink = project.website_url || project.playstore_url || project.appstore_url
                const primaryLabel = project.website_url ? 'Open App' : project.playstore_url ? 'Play Store' : project.appstore_url ? 'App Store' : null
                return primaryLink && primaryLabel ? (
                  <ExternalLinkButton
                    href={primaryLink}
                    projectId={project.id}
                    id="project-primary-link"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      padding: '0.65rem 1rem',
                      background: '#E50914',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      borderRadius: '0.65rem',
                      textDecoration: 'none',
                      transition: 'all 0.18s ease',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      boxShadow: '0 4px 14px rgba(229, 9, 20, 0.35)',
                    }}
                  >
                    <span>{primaryLabel}</span>
                    <Link2 size={16} />
                  </ExternalLinkButton>
                ) : null
              })()}
            </div>

            {/* Subtle Divider Line */}
            <div style={{
              width: '100%',
              height: '1px',
              background: 'rgba(255, 255, 255, 0.1)',
              margin: '0.1rem 0',
            }} />

            {/* Bottom Row: Secondary Grey Pill Buttons (Bookmark + Report + Private Feedback) */}
            <div style={{ display: 'flex', gap: '0.45rem', width: '100%', alignItems: 'center' }}>
              <BookmarkButton
                projectId={project.id}
                initialBookmarked={isBookmarked}
                requireAuth={!user}
                variant="hero"
              />

              {(!user || user.id !== project.user_id) && (
                <ReportModal
                  projectId={project.id}
                  appName={project.name}
                  requireAuth={!user}
                  variant="hero"
                />
              )}

              {(!user || user.id !== project.user_id) && (
                <PrivateFeedbackButton
                  projectId={project.id}
                  projectName={project.name}
                  developerName={(project.profiles as any)?.display_name || (project.profiles as any)?.username}
                  isOwner={false}
                  requireAuth={!user}
                  variant="hero"
                />
              )}

              {user && project.user_id === user.id && (
                <Link
                  href={`/dashboard/projects/edit/${project.id}`}
                  id="edit-app-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.55rem 0.75rem',
                    background: '#222226',
                    border: '1px solid rgba(229, 9, 20, 0.5)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                >
                  <Pencil size={13} style={{ color: '#E50914' }} /> Edit App
                </Link>
              )}

              {isAdmin && (
                <AdminDeleteButton projectId={project.id} appName={project.name} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Main body */}
      <div className="details-layout-container" style={{ width: '100%', maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem', boxSizing: 'border-box', overflowX: 'clip' }}>

        {/* Left / Main column — screenshots + description + tags */}
        <div className="details-main-content" style={{ width: '100%', maxWidth: '100%', overflowX: 'clip' }}>

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
                    {pt.tags?.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar — Inspired by reference design */}
        <aside className="details-sidebar">
          {/* ── CARD 1: App Details, Platforms, Stats, Share ── */}
          <div style={{
            background: '#0D0D0E',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.25rem',
            marginBottom: '1rem',
          }}>
            {/* 1. App Details */}
            <h3 style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#8E8E93',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              margin: '0 0 0.75rem 0',
            }}>
              App Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {/* Developer Item */}
              {(project.profiles as any)?.username ? (
                <Link
                  href={`/developer/${(project.profiles as any).username}`}
                  className="sidepanel-row-link"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.5rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2A2A30 0%, #1A1A1E 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}>
                      {(project.profiles as any).avatar_url ? (
                        <img
                          src={(project.profiles as any).avatar_url}
                          alt={(project.profiles as any).username}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF' }}>
                          {((project.profiles as any).username?.[0] || 'D').toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.72rem', color: '#71717A', fontWeight: 500, lineHeight: 1.2 }}>
                        Developer
                      </div>
                      <div style={{
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        color: '#FFFFFF',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {(project.profiles as any).display_name || (project.profiles as any).username}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={15} style={{ color: '#555555', flexShrink: 0 }} />
                </Link>
              ) : null}

              {/* Category Item */}
              {(project.categories as any)?.name ? (
                <Link
                  href={`/browse?category=${(project.categories as any)?.slug || ''}`}
                  className="sidepanel-row-link"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.5rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#A1A1AA',
                      flexShrink: 0,
                    }}>
                      <FolderOpen size={15} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.72rem', color: '#71717A', fontWeight: 500, lineHeight: 1.2 }}>
                        Category
                      </div>
                      <div style={{
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        color: '#FFFFFF',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {(project.categories as any)?.name}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={15} style={{ color: '#555555', flexShrink: 0 }} />
                </Link>
              ) : null}

              {/* GitHub Repo (if exists) */}
              {project.github_url && (
                <ExternalLinkButton
                  href={project.github_url}
                  projectId={project.id}
                  id="project-sidebar-github-link"
                  className="sidepanel-row-link"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.5rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#A1A1AA',
                      flexShrink: 0,
                    }}>
                      <GitBranch size={15} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.72rem', color: '#71717A', fontWeight: 500, lineHeight: 1.2 }}>
                        Repository
                      </div>
                      <div style={{
                        fontSize: '0.86rem',
                        fontWeight: 600,
                        color: '#FFFFFF',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        GitHub Repo
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={15} style={{ color: '#555555', flexShrink: 0 }} />
                </ExternalLinkButton>
              )}
            </div>

            {/* Divider */}
            {((project.platforms as string[])?.length > 0) && (
              <>
                <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)', margin: '0.9rem 0' }} />

                {/* 2. Platforms */}
                <h3 style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#8E8E93',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  margin: '0 0 0.65rem 0',
                }}>
                  Platforms
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flexWrap: 'wrap' }}>
                  {(project.platforms as string[]).map(p => {
                    const norm = p.toLowerCase()
                    let icon = <Globe size={14} style={{ color: '#A1A1AA' }} />
                    let label = p.charAt(0).toUpperCase() + p.slice(1)
                    if (norm === 'web') {
                      icon = <Globe size={14} style={{ color: '#A1A1AA' }} />
                      label = 'Web'
                    } else if (norm === 'ios') {
                      icon = <Apple size={14} style={{ color: '#A1A1AA' }} />
                      label = 'iOS'
                    } else if (norm === 'android') {
                      icon = <Bot size={14} style={{ color: '#A1A1AA' }} />
                      label = 'Android'
                    } else if (norm === 'windows' || norm === 'win') {
                      icon = <WindowsIcon size={13} style={{ color: '#A1A1AA' }} />
                      label = 'Windows'
                    } else if (norm === 'macos' || norm === 'mac') {
                      icon = <Apple size={14} style={{ color: '#A1A1AA' }} />
                      label = 'macOS'
                    } else if (norm === 'linux') {
                      icon = <Terminal size={14} style={{ color: '#A1A1AA' }} />
                      label = 'Linux'
                    } else if (norm === 'desktop') {
                      icon = <Monitor size={14} style={{ color: '#A1A1AA' }} />
                      label = 'Desktop'
                    }
                    return (
                      <span key={p} style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.8rem',
                        color: '#D4D4D8',
                        fontWeight: 500,
                      }}>
                        {icon}
                        {label}
                      </span>
                    )
                  })}
                </div>
              </>
            )}

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)', margin: '0.9rem 0' }} />

            {/* 3. Stats */}
            <h3 style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#8E8E93',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              margin: '0 0 0.65rem 0',
            }}>
              Stats
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {/* Total Views */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', color: '#8E8E93' }}>
                  <Eye size={14} style={{ color: '#71717A' }} /> Total Views
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>
                  {formatCount(project.view_count)}
                </span>
              </div>

              {/* Rating */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', color: '#8E8E93' }}>
                  <Star size={14} style={{ color: '#E5A00D', fill: '#E5A00D' }} /> Rating
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF' }}>
                  {reviewsCount > 0 ? `${avgRating} (${reviewsCount})` : '—'}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)', margin: '0.9rem 0' }} />

            {/* 4. Share */}
            <h3 style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#8E8E93',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              margin: '0 0 0.65rem 0',
            }}>
              Share
            </h3>
            <ShareCard projectName={project.name} projectSlug={project.slug} variant="inline" />
          </div>

          {/* ── CARD 2: Developer Card ── */}
          {(project.profiles as any)?.username && (
            <div style={{
              background: '#0D0D0E',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '1.25rem',
            }}>
              <h3 style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#8E8E93',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                margin: '0 0 0.75rem 0',
              }}>
                Developer
              </h3>
              <Link
                href={`/developer/${(project.profiles as any).username}`}
                className="sidepanel-dev-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textDecoration: 'none',
                  padding: '0.35rem 0.25rem',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2A2A30 0%, #1A1A1E 100%)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}>
                    {(project.profiles as any).avatar_url ? (
                      <img
                        src={(project.profiles as any).avatar_url}
                        alt={(project.profiles as any).username}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF' }}>
                        {((project.profiles as any).username?.[0] || 'D').toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {(project.profiles as any).display_name || (project.profiles as any).username}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#71717A', marginTop: '0.1rem' }}>
                      {devAppsCount} {devAppsCount === 1 ? 'app' : 'apps'}
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: '#555555', flexShrink: 0 }} />
              </Link>
            </div>
          )}
        </aside>

        {/* Customer Reviews & Comments Section */}
        <div className="details-comments">
          <ProjectCommentsSection
            projectId={project.id}
            slug={project.slug}
            isDeveloper={project.user_id === user?.id}
            isLoggedIn={!!user}
            isAdmin={isAdmin}
            currentUserId={user?.id ?? null}
            initialComments={initialComments}
            projectStage={project.stage}
            projectPlatforms={project.platforms}
          />
        </div>
      </div>
    </div>
  )
}
