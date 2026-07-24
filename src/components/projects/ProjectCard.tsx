'use client'

import Link from 'next/link'
import UpvoteButton from './UpvoteButton'
import { Bookmark, ExternalLink, Globe } from 'lucide-react'
import { useState } from 'react'

interface ProjectCardProps {
  project: {
    id: string
    name: string
    slug: string
    tagline: string
    icon_url: string | null
    upvote_count: number
    stage: string
    platforms: string[]
    categories?: { name: string; slug: string } | null
  }
  isUpvoted?: boolean
  isBookmarked?: boolean
  isAuthenticated?: boolean
}

const STAGE_COLORS: Record<string, { bg: string; color: string }> = {
  beta:       { bg: 'rgba(243,156,18,0.15)',   color: '#F39C12' },
  production: { bg: 'rgba(46,204,113,0.15)',   color: '#2ECC71' },
}

export default function ProjectCard({ project, isUpvoted = false, isBookmarked = false, isAuthenticated = false }: ProjectCardProps) {
  const [hovered, setHovered] = useState(false)
  const stage = STAGE_COLORS[project.stage] ?? STAGE_COLORS.beta

  return (
    <div
      className="card-hover"
      style={{
        background: '#1F1F1F', borderRadius: '0.75rem',
        overflow: 'hidden', position: 'relative',
        transform: hovered ? 'scale(1.02)' : 'scale(1)',
        borderColor: hovered ? '#444' : '#2B2B2B',
        boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.5)' : 'none',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top section: icon + upvote */}
      <div style={{ padding: '1.25rem 1.25rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* App icon */}
        <div style={{
          width: '56px', height: '56px', borderRadius: '0.75rem',
          background: '#262626', border: '1px solid #2B2B2B',
          overflow: 'hidden', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {project.icon_url ? (
            <img src={project.icon_url} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Globe size={24} style={{ color: '#444' }} />
          )}
        </div>

        {/* Upvote */}
        <UpvoteButton
          projectId={project.id}
          initialCount={project.upvote_count}
          initialUpvoted={isUpvoted}
          requireAuth={!isAuthenticated}
        />
      </div>

      {/* Content */}
      <Link href={`/browse/${project.slug}`} style={{ textDecoration: 'none', display: 'block', padding: '0.85rem 1.25rem 1.25rem' }}>
        {/* Name + stage */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', margin: 0, lineHeight: 1.2 }}>
            {project.name}
          </h3>
          <span style={{
            fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em',
            textTransform: 'uppercase', padding: '0.15rem 0.45rem',
            borderRadius: '9999px', background: stage.bg, color: stage.color,
          }}>
            {project.stage}
          </span>
        </div>

        {/* Tagline */}
        <p style={{
          fontSize: '0.85rem', color: '#AAAAAA', margin: '0 0 0.75rem',
          lineHeight: 1.45, display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {project.tagline}
        </p>

        {/* Category + platforms */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {project.categories && (
            <span style={{
              fontSize: '0.72rem', fontWeight: 600, color: '#E50914',
              background: 'rgba(229,9,20,0.12)', padding: '0.2rem 0.55rem',
              borderRadius: '0.3rem',
            }}>
              {project.categories.name}
            </span>
          )}
          {project.platforms?.slice(0, 2).map(p => (
            <span key={p} style={{
              fontSize: '0.72rem', color: '#666', background: '#262626',
              padding: '0.2rem 0.55rem', borderRadius: '0.3rem', textTransform: 'capitalize',
            }}>
              {p}
            </span>
          ))}
        </div>
      </Link>
    </div>
  )
}
