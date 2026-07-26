'use client'

import Link from 'next/link'
import UpvoteButton from './UpvoteButton'
import { Globe, ArrowUpRight, Flame, Pencil } from 'lucide-react'
import { useState } from 'react'

interface ProjectCardProps {
  project: {
    id: string
    user_id?: string | null
    name: string
    slug: string
    tagline: string
    icon_url: string | null
    upvote_count: number
    stage: string
    platforms: string[]
    categories?: { name: string; slug: string } | null
    banner_url?: string | null
    project_images?: { image_url: string }[]
  }
  isUpvoted?: boolean
  isBookmarked?: boolean
  isAuthenticated?: boolean
  currentUserId?: string
}

const STAGE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  beta:       { bg: 'rgba(243, 156, 18, 0.15)',  color: '#F39C12', border: 'rgba(243, 156, 18, 0.3)' },
  production: { bg: 'rgba(46, 204, 113, 0.15)',  color: '#2ECC71', border: 'rgba(46, 204, 113, 0.3)' },
}

export default function ProjectCard({ project, isUpvoted = false, isAuthenticated = false, currentUserId }: ProjectCardProps) {
  const [hovered, setHovered] = useState(false)
  const stage = STAGE_COLORS[project.stage] ?? { bg: 'rgba(229, 9, 20, 0.15)', color: '#E50914', border: 'rgba(229, 9, 20, 0.3)' }

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, #0F0F0F 0%, #080808 100%)',
        borderRadius: '0.85rem',
        overflow: 'hidden',
        position: 'relative',
        border: hovered ? '1px solid #E50914' : '1px solid rgba(255, 255, 255, 0.07)',
        transform: hovered ? 'translateY(-5px) scale(1.015)' : 'translateY(0) scale(1)',
        boxShadow: hovered
          ? '0 16px 36px rgba(229, 9, 20, 0.35), 0 6px 16px rgba(0, 0, 0, 0.9)'
          : '0 4px 16px rgba(0, 0, 0, 0.4)',
        transition: 'all 0.25s cubic-bezier(0.2, 0, 0, 1)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxSizing: 'border-box',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top Red Accent Edge Line on Hover */}
      <div style={{
        height: '3px',
        width: '100%',
        background: hovered ? 'linear-gradient(90deg, #E50914 0%, #FF6B6B 100%)' : 'transparent',
        transition: 'background 0.25s ease',
      }} />

      {/* Card Header Container */}
      <div style={{
        padding: '1.25rem 1.25rem 0.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '0.85rem',
      }}>
        {/* App Icon Squircle */}
        <Link href={`/browse/${project.slug}`} style={{ textDecoration: 'none' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: '#161616',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 16px rgba(0,0,0,0.6)',
            transition: 'transform 0.2s ease',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
          }}>
            {project.icon_url ? (
              <img
                src={project.icon_url}
                alt={project.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Globe size={24} style={{ color: '#E50914' }} />
            )}
          </div>
        </Link>

        {/* Upvote Action Button */}
        <UpvoteButton
          projectId={project.id}
          initialCount={project.upvote_count}
          initialUpvoted={isUpvoted}
          requireAuth={!isAuthenticated}
        />
      </div>

      {/* Card Main Body */}
      <Link
        href={`/browse/${project.slug}`}
        style={{
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          padding: '0.5rem 1.25rem 1.25rem',
        }}
      >
        {/* Title + Stage */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          marginBottom: '0.4rem',
        }}>
          <h3 style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            color: '#FFFFFF',
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}>
            {project.name}
            <ArrowUpRight
              size={15}
              style={{
                color: hovered ? '#E50914' : 'rgba(255,255,255,0.4)',
                transition: 'color 0.2s, transform 0.2s',
                transform: hovered ? 'translate(2px, -2px)' : 'none',
              }}
            />
          </h3>

          {/* Stage Badge */}
          {project.stage && (
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              padding: '0.2rem 0.5rem',
              borderRadius: '9999px',
              background: stage.bg,
              color: stage.color,
              border: `1px solid ${stage.border}`,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              {project.stage}
            </span>
          )}
        </div>

        {/* Tagline */}
        <p style={{
          fontSize: '0.85rem',
          color: '#AAAAAA',
          margin: '0 0 1rem',
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          flex: 1,
        }}>
          {project.tagline}
        </p>

        {/* Category & Platform Pills Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          flexWrap: 'wrap',
          marginTop: 'auto',
          paddingTop: '0.6rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          {project.categories && (
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#FFFFFF',
              background: 'rgba(229, 9, 20, 0.2)',
              border: '1px solid rgba(229, 9, 20, 0.4)',
              padding: '0.2rem 0.6rem',
              borderRadius: '0.35rem',
            }}>
              {project.categories.name}
            </span>
          )}

          {project.platforms?.slice(0, 2).map(p => (
            <span
              key={p}
              style={{
                fontSize: '0.7rem',
                color: '#888888',
                background: '#161616',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '0.2rem 0.55rem',
                borderRadius: '0.35rem',
                textTransform: 'capitalize',
              }}
            >
              {p}
            </span>
          ))}

          {currentUserId && project.user_id === currentUserId && (
            <span
              id={`edit-card-${project.id}`}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = `/dashboard/projects/edit/${project.id}`
              }}
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#FFFFFF',
                background: 'rgba(229, 9, 20, 0.25)',
                border: '1px solid #E50914',
                padding: '0.2rem 0.6rem',
                borderRadius: '0.35rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                marginLeft: 'auto',
                transition: 'all 0.2s',
              }}
            >
              <Pencil size={11} style={{ color: '#E50914' }} /> Edit App
            </span>
          )}
        </div>
      </Link>
    </div>
  )
}
