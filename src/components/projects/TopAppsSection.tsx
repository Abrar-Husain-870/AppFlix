'use client'

import Link from 'next/link'
import ProjectCard from '@/components/projects/ProjectCard'
import ViewModeToggle, { useCardViewMode } from '@/components/ui/ViewModeToggle'
import AppIcon from '@/components/ui/AppIcon'
import UpvoteButton from '@/components/projects/UpvoteButton'

interface TopAppsSectionProps {
  projects: any[]
  userUpvotedIds: string[]
  isAuthenticated: boolean
  currentUserId?: string
}

export default function TopAppsSection({
  projects,
  userUpvotedIds,
  isAuthenticated,
  currentUserId,
}: TopAppsSectionProps) {
  const [viewMode, handleViewChange] = useCardViewMode()
  const upvotedSet = new Set(userUpvotedIds)

  if (!projects || projects.length === 0) return null

  return (
    <section style={{ padding: '2rem 0.85rem', maxWidth: '1280px', margin: '0 auto', boxSizing: 'border-box', width: '100%' }}>
      {/* Header with Title, View Mode Toggle, and View all link */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.25rem',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <div>
          <div className="accent-line" style={{ width: '2rem', marginBottom: '0.5rem' }} />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', margin: 0 }}>
            Top Apps
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <Link href="/browse" style={{ color: '#E50914', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
            View all →
          </Link>

          <ViewModeToggle viewMode={viewMode} onChange={handleViewChange} />
        </div>
      </div>

      {/* Projects Grid / Pill Display */}
      {viewMode === 'pill' ? (
        <div className="pill-cards-grid">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              isUpvoted={upvotedSet.has(project.id)}
              isAuthenticated={isAuthenticated}
              currentUserId={currentUserId}
              viewMode="pill"
            />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.75rem', width: '100%' }}>
          {projects.map(project => (
            <div
              key={project.id}
              className="card-hover"
              style={{
                background: 'linear-gradient(145deg, #0F0F0F 0%, #080808 100%)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '0.75rem',
                padding: '0.75rem 0.85rem',
                minHeight: '78px',
                display: 'flex',
                gap: '0.65rem',
                alignItems: 'center',
                boxSizing: 'border-box',
                overflow: 'hidden',
                width: '100%',
                maxWidth: '100%',
              }}
            >
              <Link
                href={`/browse/${project.slug}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  flex: 1,
                  minWidth: 0,
                  textDecoration: 'none',
                }}
              >
                <AppIcon
                  src={project.icon_url}
                  alt={project.name}
                  size={44}
                  fallbackText={project.name}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.15rem',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {project.name}
                  </h3>
                  <p style={{
                    fontSize: '0.78rem', color: '#AAAAAA', margin: 0, lineHeight: 1.3,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {project.tagline}
                  </p>
                </div>
              </Link>

              <div style={{ flexShrink: 0 }}>
                <UpvoteButton
                  projectId={project.id}
                  initialCount={project.upvote_count}
                  initialUpvoted={upvotedSet.has(project.id)}
                  requireAuth={!isAuthenticated}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
