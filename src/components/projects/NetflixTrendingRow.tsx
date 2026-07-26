'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowUpRight, Flame } from 'lucide-react'

interface Project {
  id: string
  name: string
  slug: string
  tagline: string
  icon_url: string | null
  upvote_count: number
  banner_url?: string | null
  project_images?: { image_url: string }[]
  categories?: { name: string; slug: string } | { name: string; slug: string }[] | null | any
}

interface NetflixTrendingRowProps {
  projects: Project[]
  title?: string
}

export default function NetflixTrendingRow({ projects, title = 'Trending Now' }: NetflixTrendingRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  const checkScroll = () => {
    if (!rowRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = rowRef.current
    setShowLeftArrow(scrollLeft > 20)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20)
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [projects])

  const scroll = (direction: 'left' | 'right') => {
    if (!rowRef.current) return
    const scrollAmount = direction === 'left' ? -600 : 600
    rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  if (!projects || projects.length === 0) return null

  // Take top 10 projects
  const topProjects = projects.slice(0, 10)

  return (
    <section style={{
      padding: '1.5rem 0 2.5rem',
      position: 'relative',
      width: '100%',
      boxSizing: 'border-box',
    }}>
      {/* Container aligned with the rest of the page */}
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '0 2rem',
        boxSizing: 'border-box',
      }}>
        {/* Title */}
        <h2 style={{
          fontSize: 'clamp(1.25rem, 3vw, 1.6rem)',
          fontWeight: 800,
          color: '#FFFFFF',
          letterSpacing: '-0.02em',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
        }}>
          {title}
        </h2>

        {/* Carousel Container */}
        <div style={{ position: 'relative' }}>
          {/* Left Arrow Button */}
          {showLeftArrow && (
            <button
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              style={{
                position: 'absolute',
                left: '-1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 30,
                width: '28px',
                height: '75px',
                background: 'rgba(20, 20, 20, 0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s, transform 0.2s',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(229, 9, 20, 0.85)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(20, 20, 20, 0.75)'}
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Right Arrow Button */}
          {showRightArrow && (
            <button
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              style={{
                position: 'absolute',
                right: '-1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 30,
                width: '28px',
                height: '75px',
                background: 'rgba(20, 20, 20, 0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s, transform 0.2s',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(229, 9, 20, 0.85)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(20, 20, 20, 0.75)'}
            >
              <ChevronRight size={22} />
            </button>
          )}

          {/* Horizontal Scroll Row */}
          <div
            ref={rowRef}
            onScroll={checkScroll}
            style={{
              display: 'flex',
              gap: '1.75rem',
              overflowX: 'auto',
              overflowY: 'hidden',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              /* 2.5rem (40px) left padding provides 32px breathing room for the rank numbers floating at -8px */
              padding: '1.25rem 2.5rem 2.5rem 2.5rem',
              scrollPaddingLeft: '2.5rem',
              scrollPaddingRight: '2.5rem',
              scrollSnapType: 'x mandatory',
              boxSizing: 'border-box',
            }}
            className="no-scrollbar"
          >
            {topProjects.map((project, index) => {
              const posterSrc =
                project.project_images?.[0]?.image_url ||
                project.banner_url ||
                null
              const iconSrc = project.icon_url || null

              return (
                <Link
                  key={project.id}
                  href={`/browse/${project.slug}`}
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    position: 'relative',
                    flexShrink: 0,
                    width: '200px',
                    height: '270px',
                    scrollSnapAlign: 'start',
                    alignItems: 'flex-end',
                    transition: 'transform 0.25s cubic-bezier(0.2, 0, 0, 1)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.06) translateY(-6px)'
                    const card = e.currentTarget.querySelector('.trending-poster-card') as HTMLElement
                    if (card) {
                      card.style.borderColor = '#E50914'
                      card.style.boxShadow = '0 16px 40px rgba(229, 9, 20, 0.45)'
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1) translateY(0)'
                    const card = e.currentTarget.querySelector('.trending-poster-card') as HTMLElement
                    if (card) {
                      card.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                      card.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.8)'
                    }
                  }}
                >
                  {/* Poster Card Container */}
                  <div
                    className="trending-poster-card"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: '165px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: 'linear-gradient(145deg, #0F0F0F 0%, #080808 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8)',
                      transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
                      zIndex: 1,
                    }}
                  >
                    {posterSrc ? (
                      /* Option A: Full Cover Poster / Banner */
                      <img
                        src={posterSrc}
                        alt={project.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    ) : iconSrc ? (
                      /* Option B: App Logo Badge on "poster backgronds for apps.jpg" Background */
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        overflow: 'hidden',
                      }}>
                        {/* Poster Background Image Asset */}
                        <img
                          src="/assets/poster backgronds for apps.jpg"
                          alt=""
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 100%)',
                        }} />

                        {/* Floating Centerpiece Glassmorphic Squircle Badge */}
                        <div style={{
                          position: 'absolute',
                          top: '42%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '125px',
                          height: '125px',
                          borderRadius: '26px',
                          overflow: 'hidden',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          boxShadow: '0 12px 28px rgba(0, 0, 0, 0.85)',
                          background: 'rgba(255, 255, 255, 0.15)',
                          backdropFilter: 'blur(10px)',
                          zIndex: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '8px',
                          boxSizing: 'border-box',
                        }}>
                          <img
                            src={iconSrc}
                            alt={project.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              borderRadius: '12px',
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      /* Option C: Fallback with "poster backgronds for apps.jpg" Background */
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        overflow: 'hidden',
                      }}>
                        <img
                          src="/assets/poster backgronds for apps.jpg"
                          alt=""
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          padding: '1rem',
                          boxSizing: 'border-box',
                        }}>
                          <div style={{
                            width: '88px',
                            height: '88px',
                            borderRadius: '20px',
                            background: 'rgba(229, 9, 20, 0.35)',
                            border: '1px solid rgba(229, 9, 20, 0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '0.75rem',
                            color: '#FFFFFF',
                            fontWeight: 900,
                            fontSize: '2.2rem',
                            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.6)',
                          }}>
                            {project.name.charAt(0)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AppFlix Circular Light Icon Stamp (Top-Left Area) */}
                    <img
                      src="/assets/app-logos/AppFlix_circular_Icon__light_-removebg-preview.png"
                      alt="AppFlix"
                      style={{
                        position: 'absolute',
                        top: '16px',
                        left: '12px',
                        width: '32px',
                        height: '32px',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.85))',
                        zIndex: 5,
                        pointerEvents: 'none',
                      }}
                    />

                    {/* Bottom Content Gradient Overlay (4rem left padding clears rank number completely) */}
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 45%, transparent 75%)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      padding: '0.85rem 0.65rem 0.85rem 2.2rem',
                      boxSizing: 'border-box',
                      zIndex: 3,
                    }}>
                      <h3 style={{
                        color: '#FFFFFF',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        margin: 0,
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {project.name}
                      </h3>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '0.35rem',
                      }}>
                        <span style={{
                          color: '#E50914',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                        }}>
                          <Flame size={11} /> {project.upvote_count}
                        </span>
                        <ArrowUpRight size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
                      </div>
                    </div>
                  </div>

                  {/* Giant Netflix Outline Rank Number (Ultra-sleek 1px outline stroke) */}
                  <span style={{
                    position: 'absolute',
                    left: index >= 9 ? '-18px' : '-8px',
                    bottom: '-16px',
                    fontSize: '8.5rem',
                    fontWeight: 900,
                    fontFamily: 'Impact, -apple-system, sans-serif',
                    lineHeight: 0.8,
                    color: '#000000',
                    WebkitTextStroke: '1px #D4D4D4',
                    filter: 'drop-shadow(3px 5px 10px rgba(0,0,0,0.95))',
                    zIndex: 10,
                    userSelect: 'none',
                    pointerEvents: 'none',
                    letterSpacing: '-0.06em',
                  }}>
                    {index + 1}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
