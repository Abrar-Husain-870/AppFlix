'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import UpvoteButton from './UpvoteButton'
import { Globe, ArrowUpRight, Flame, Pencil } from 'lucide-react'
import { useState } from 'react'
import AppIcon from '@/components/ui/AppIcon'

export type ProjectCardViewMode = 'grid' | 'pill'

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
  viewMode?: ProjectCardViewMode
}

const STAGE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  beta:       { bg: 'rgba(243, 156, 18, 0.15)',  color: '#F39C12', border: 'rgba(243, 156, 18, 0.3)' },
  production: { bg: 'rgba(46, 204, 113, 0.15)',  color: '#2ECC71', border: 'rgba(46, 204, 113, 0.3)' },
}

export default function ProjectCard({
  project,
  isUpvoted = false,
  isAuthenticated = false,
  currentUserId,
  viewMode = 'grid',
}: ProjectCardProps) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const [imageError, setImageError] = useState(false)
  const stage = STAGE_COLORS[project.stage] ?? { bg: 'rgba(229, 9, 20, 0.15)', color: '#E50914', border: 'rgba(229, 9, 20, 0.3)' }

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('#edit-card-' + project.id) ||
      target.closest('#edit-pill-card-' + project.id)
    ) {
      return
    }
    router.push(`/browse/${project.slug}`)
  }

  /* ── Pill View (Horizontal 2-Column Banner Card) ────────────────────── */
  if (viewMode === 'pill') {
    const isBeta = (project.stage || '').toLowerCase() === 'beta'

    // Parse pill background preference if saved on icon_url (?pill_bg=white|black|blur|#hex|default)
    const pillBgMatch = project.icon_url?.match(/[?&]pill_bg=([^&#]+)/)
    const pillBg = pillBgMatch ? decodeURIComponent(pillBgMatch[1]) : 'default'
    const isWhite = pillBg === 'white'
    const isBlack = pillBg === 'black'
    const isBlur = pillBg === 'blur'
    const isCustom = pillBg.startsWith('#')
    const isDefault = !isWhite && !isBlack && !isBlur && !isCustom

    let pedestalBg = project.banner_url
      ? `linear-gradient(rgba(14, 4, 7, 0.72), rgba(14, 4, 7, 0.94)), url(${project.banner_url}) center/cover no-repeat`
      : 'linear-gradient(145deg, #18080a 0%, #0d0405 60%, #080808 100%)'

    if (isWhite) {
      pedestalBg = 'linear-gradient(145deg, #FFFFFF 0%, #EEEEEE 100%)'
    } else if (isBlack) {
      pedestalBg = '#050505'
    } else if (isBlur) {
      pedestalBg = '#0B0B0B'
    } else if (isCustom) {
      pedestalBg = pillBg
    }

    return (
      <div
        className="pill-card"
        onClick={handleCardClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Left ⅓: Full-height Brand / Logo Showcase Pedestal */}
        <div
          className="pill-card-brand-side"
          style={{
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.65rem 0.5rem',
            background: pedestalBg,
            borderRight: isWhite ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.08)',
            boxSizing: 'border-box',
          }}
        >
          {/* Base AppFlix Studio Warm Glow (Default mode) */}
          {isDefault && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 50% 50%, rgba(229, 9, 20, 0.22) 0%, rgba(229, 9, 20, 0.05) 50%, transparent 70%)',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          )}

          {/* Dynamic Ambient Art Bloom (Default mode: subtle / Blur mode: rich & prominent) */}
          {project.icon_url && (isDefault || isBlur) && (
            <div
              style={{
                position: 'absolute',
                inset: isBlur ? '-25%' : '-30%',
                backgroundImage: `url(${project.icon_url})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                filter: isBlur ? 'blur(12px) saturate(260%) brightness(1.18)' : 'blur(28px) saturate(280%) brightness(1.35)',
                opacity: isBlur ? (hovered ? 0.95 : 0.88) : (hovered ? 0.8 : 0.55),
                transform: isBlur ? (hovered ? 'scale(1.42)' : 'scale(1.35)') : (hovered ? 'scale(1.2)' : 'scale(1.05)'),
                transition: 'transform 0.4s cubic-bezier(0.2, 0, 0, 1), opacity 0.4s ease',
                pointerEvents: 'none',
                zIndex: isBlur ? 1 : 2,
              }}
            />
          )}

          {/* Blur mode dark vignette overlay */}
          {isBlur && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.55) 100%)',
                pointerEvents: 'none',
                zIndex: 2,
              }}
            />
          )}

          {/* White mode lighting */}
          {isWhite && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 50% 35%, rgba(255, 255, 255, 0.9) 0%, rgba(230, 230, 230, 0.4) 100%)',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          )}

          {/* Black mode spotlight */}
          {isBlack && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.08) 0%, transparent 65%)',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          )}

          {/* Custom color highlight overlay */}
          {isCustom && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 50% 40%, rgba(255, 255, 255, 0.2) 0%, rgba(0, 0, 0, 0.35) 100%)',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          )}

          {/* Radial Studio Spotlight (Default mode) */}
          {isDefault && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.12) 0%, transparent 65%)',
                pointerEvents: 'none',
                zIndex: 3,
              }}
            />
          )}

          {/* Top Glass Rim Highlight (not shown on pure white) */}
          {!isWhite && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '40%',
                background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 0%, transparent 100%)',
                pointerEvents: 'none',
                zIndex: 3,
              }}
            />
          )}

          {/* App Logo — 74px Direct Squircle without black borders */}
          <Link
            href={`/browse/${project.slug}`}
            style={{
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 4,
              transition: 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)',
              transform: hovered ? 'scale(1.06)' : 'scale(1)',
            }}
          >
            {project.icon_url && !imageError ? (
              <img
                src={project.icon_url}
                alt={project.name}
                onError={() => setImageError(true)}
                style={{
                  width: 'clamp(62px, 17vw, 74px)',
                  height: 'clamp(62px, 17vw, 74px)',
                  borderRadius: '16px',
                  objectFit: 'cover',
                  display: 'block',
                  border: isWhite ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
                  outline: 'none',
                  boxShadow: isWhite
                    ? (hovered ? '0 12px 28px rgba(0, 0, 0, 0.35)' : '0 8px 22px rgba(0, 0, 0, 0.24)')
                    : isBlack
                    ? (hovered ? '0 12px 28px rgba(0, 0, 0, 0.98), 0 0 0 1px rgba(255, 255, 255, 0.2)' : '0 8px 24px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.1)')
                    : isBlur
                    ? (hovered ? '0 12px 28px rgba(0, 0, 0, 0.85), 0 0 1px rgba(255, 255, 255, 0.5)' : '0 8px 24px rgba(0, 0, 0, 0.75)')
                    : isCustom
                    ? (hovered ? '0 12px 28px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.2)' : '0 8px 24px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.15)')
                    : (hovered
                      ? '0 10px 24px rgba(0, 0, 0, 0.5), 0 0 16px rgba(229, 9, 20, 0.25)'
                      : '0 6px 16px rgba(0, 0, 0, 0.35)'),
                  transition: 'box-shadow 0.25s ease',
                }}
              />
            ) : (
              <div
                style={{
                  width: 'clamp(62px, 17vw, 74px)',
                  height: 'clamp(62px, 17vw, 74px)',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #222222 0%, #141414 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#E50914',
                  fontWeight: 800,
                  fontSize: 'clamp(1.6rem, 5vw, 2rem)',
                  boxShadow: hovered
                    ? '0 10px 24px rgba(0, 0, 0, 0.5), 0 0 16px rgba(229, 9, 20, 0.25)'
                    : '0 6px 16px rgba(0, 0, 0, 0.35)',
                  userSelect: 'none',
                  transition: 'box-shadow 0.25s ease',
                }}
              >
                {project.name.trim().charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
        </div>

        {/* Right ⅔: Details & Actions Side */}
        <div
          className="pill-card-info-side"
          style={{
            padding: '0.75rem 0.9rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minWidth: 0,
            boxSizing: 'border-box',
          }}
        >
          <div>
            {/* Top Row: App Name + External Link Icon & Top-Right Upvote Button */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '0.5rem',
              marginBottom: '0.2rem',
            }}>
              <Link
                href={`/browse/${project.slug}`}
                style={{
                  textDecoration: 'none',
                  minWidth: 0,
                  flex: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <h3
                  style={{
                    fontSize: '1.02rem',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    margin: 0,
                    lineHeight: 1.25,
                    letterSpacing: '-0.015em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {project.name}
                </h3>
                <ArrowUpRight
                  size={15}
                  style={{
                    color: hovered ? '#E50914' : 'rgba(255, 255, 255, 0.45)',
                    flexShrink: 0,
                    transition: 'transform 0.2s, color 0.2s',
                    transform: hovered ? 'translate(2px, -2px)' : 'none',
                  }}
                />
              </Link>

              {/* Upvote Button in Top-Right Corner */}
              <div style={{ flexShrink: 0 }}>
                <UpvoteButton
                  projectId={project.id}
                  initialCount={project.upvote_count}
                  initialUpvoted={isUpvoted}
                  requireAuth={!isAuthenticated}
                />
              </div>
            </div>

            {/* Short Summary (Tagline) */}
            <p
              style={{
                fontSize: '0.78rem',
                color: '#9E9E9E',
                margin: '0.1rem 0 0.5rem',
                lineHeight: 1.35,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {project.tagline}
            </p>

            {/* Production / Beta Status Badge */}
            <div style={{ marginBottom: '0.5rem' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.64rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '9999px',
                  background: isBeta
                    ? 'rgba(243, 156, 18, 0.12)'
                    : 'rgba(46, 204, 113, 0.12)',
                  color: isBeta ? '#F39C12' : '#2ECC71',
                  border: `1px solid ${isBeta ? 'rgba(243, 156, 18, 0.4)' : 'rgba(46, 204, 113, 0.4)'}`,
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: isBeta ? '#F39C12' : '#2ECC71',
                    boxShadow: isBeta
                      ? '0 0 5px rgba(243, 156, 18, 0.8)'
                      : '0 0 5px rgba(46, 204, 113, 0.8)',
                    flexShrink: 0,
                  }}
                />
                {project.stage || 'PRODUCTION'}
              </span>
            </div>
          </div>

          {/* Bottom Category and Platform Tags Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              flexWrap: 'wrap',
              marginTop: 'auto',
            }}
          >
            {project.categories?.name && (
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  background: 'rgba(229, 9, 20, 0.16)',
                  border: '1px solid rgba(229, 9, 20, 0.45)',
                  padding: '0.18rem 0.5rem',
                  borderRadius: '0.35rem',
                  whiteSpace: 'nowrap',
                }}
              >
                {project.categories.name}
              </span>
            )}

            {project.platforms?.map(p => (
              <span
                key={p}
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  color: '#CCCCCC',
                  background: '#1A1A1A',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '0.18rem 0.5rem',
                  borderRadius: '0.35rem',
                  textTransform: 'capitalize',
                  whiteSpace: 'nowrap',
                }}
              >
                {p}
              </span>
            ))}

            {currentUserId && project.user_id === currentUserId && (
              <span
                id={`edit-pill-card-${project.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  window.location.href = `/dashboard/projects/edit/${project.id}`
                }}
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  background: 'rgba(229, 9, 20, 0.25)',
                  border: '1px solid #E50914',
                  padding: '0.18rem 0.45rem',
                  borderRadius: '0.3rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  marginLeft: 'auto',
                  transition: 'all 0.2s',
                }}
              >
                <Pencil size={10} style={{ color: '#E50914' }} /> Edit
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ── Standard Grid View (Current Card - Fully Preserved) ─────────────── */
  return (
    <div
      onClick={handleCardClick}
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
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Card Header Container */}
      <div style={{
        padding: '1.25rem 1.25rem 0.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '0.85rem',
      }}>
        {/* App Icon Squircle */}
        <Link
          href={`/browse/${project.slug}`}
          style={{
            textDecoration: 'none',
            display: 'block',
            transition: 'transform 0.2s ease',
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          <AppIcon
            src={project.icon_url}
            alt={project.name}
            size={54}
            fallbackText={project.name}
          />
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
