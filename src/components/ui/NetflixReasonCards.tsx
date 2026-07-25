'use client'

import { useState } from 'react'

const CARDS_DATA = [
  {
    id: 1,
    title: 'Discover Student Innovation',
    body: 'Explore apps, tools, websites, and AI projects built by students across the university.',
    icon: (
      /* 3D Glowing TV Monitor Screen Graphic */
      <div style={{ position: 'relative', width: '72px', height: '60px' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.6) 0%, rgba(229, 9, 20, 0.4) 60%, transparent 100%)',
          filter: 'blur(12px)',
          borderRadius: '50%',
        }} />
        <svg width="72" height="60" viewBox="0 0 72 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'relative', zIndex: 2 }}>
          <defs>
            <linearGradient id="tv-screen-grad" x1="0" y1="0" x2="72" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#EC4899" />
              <stop offset="50%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#E50914" />
            </linearGradient>
            <linearGradient id="tv-frame-grad" x1="0" y1="0" x2="0" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF85C0" />
              <stop offset="100%" stopColor="#701A75" />
            </linearGradient>
            <filter id="tv-glow" x="-10" y="-10" width="92" height="80" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="4" result="effect1_foregroundBlur" />
            </filter>
          </defs>

          {/* Glow backdrop */}
          <rect x="6" y="4" width="60" height="40" rx="8" fill="url(#tv-screen-grad)" opacity="0.7" filter="url(#tv-glow)" />

          {/* TV Outer Frame */}
          <rect x="6" y="4" width="60" height="40" rx="8" fill="url(#tv-frame-grad)" stroke="#FFB7E5" strokeWidth="1.5" />

          {/* TV Screen Display */}
          <rect x="10" y="8" width="52" height="32" rx="5" fill="url(#tv-screen-grad)" />

          {/* Screen Glare Highlight */}
          <path d="M12 10 L45 10 L12 36 Z" fill="rgba(255, 255, 255, 0.25)" />

          {/* TV Stand Base */}
          <path d="M30 44 L42 44 L45 52 L27 52 Z" fill="#9333EA" />
          <ellipse cx="36" cy="53" rx="14" ry="3" fill="#E50914" opacity="0.9" />
        </svg>
      </div>
    ),
  },
  {
    id: 2,
    title: 'Publish Your Projects',
    body: 'Share your work with the campus community, build your portfolio, and receive feedback.',
    icon: (
      /* 3D Glowing Circular Down-Arrow Orb Graphic */
      <div style={{ position: 'relative', width: '64px', height: '64px' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle, rgba(236,72,153,0.7) 0%, rgba(229,9,20,0.5) 60%, transparent 100%)',
          filter: 'blur(10px)',
          borderRadius: '50%',
        }} />
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'relative', zIndex: 2 }}>
          <defs>
            <radialGradient id="orb-grad" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFA6D5" />
              <stop offset="40%" stopColor="#EC4899" />
              <stop offset="85%" stopColor="#9333EA" />
              <stop offset="100%" stopColor="#4C1D95" />
            </radialGradient>
            <linearGradient id="arrow-grad" x1="0" y1="0" x2="0" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#FFE4E6" />
            </linearGradient>
          </defs>

          {/* 3D Orb Circle */}
          <circle cx="32" cy="32" r="28" fill="url(#orb-grad)" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" />

          {/* Inner Highlight Ring */}
          <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1" strokeDasharray="3 3" />

          {/* Down Arrow */}
          <path
            d="M32 18 V40 M22 30 L32 41 L42 30"
            stroke="url(#arrow-grad)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
  },
  {
    id: 3,
    title: 'Find Tools for Every Need',
    body: 'Browse projects by category, department, or technology to discover solutions made by your peers.',
    icon: (
      /* 3D Glowing Telescope with Sparkles Graphic */
      <div style={{ position: 'relative', width: '68px', height: '64px' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle, rgba(236,72,153,0.6) 0%, rgba(229,9,20,0.4) 60%, transparent 100%)',
          filter: 'blur(10px)',
        }} />
        <svg width="68" height="64" viewBox="0 0 68 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'relative', zIndex: 2 }}>
          <defs>
            <linearGradient id="scope-grad-1" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF85C0" />
              <stop offset="50%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#9333EA" />
            </linearGradient>
            <linearGradient id="scope-lens-grad" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFA6D5" />
              <stop offset="100%" stopColor="#F43F5E" />
            </linearGradient>
          </defs>

          {/* Telescope Cylinder Body */}
          <path
            d="M20 46 L48 18 L58 28 L30 56 Z"
            fill="url(#scope-grad-1)"
            stroke="#FFD1E8"
            strokeWidth="1.5"
          />

          {/* Lens Cap Rim */}
          <ellipse cx="53" cy="23" rx="8" ry="12" transform="rotate(-45 53 23)" fill="url(#scope-lens-grad)" stroke="#FFFFFF" strokeWidth="2" />
          <ellipse cx="53" cy="23" rx="5" ry="8" transform="rotate(-45 53 23)" fill="#FFE4E6" opacity="0.9" />

          {/* Eyepiece Base */}
          <rect x="14" y="48" width="10" height="8" rx="2" transform="rotate(-45 14 48)" fill="#701A75" stroke="#EC4899" />

          {/* Sparkles / Stars */}
          {/* Star 1 */}
          <path d="M12 16 L14 12 L18 10 L14 8 L12 4 L10 8 L6 10 L10 12 Z" fill="#FF4D7D" />
          {/* Star 2 */}
          <path d="M58 50 L59.5 47 L62.5 45.5 L59.5 44 L58 41 L56.5 44 L53.5 45.5 L56.5 47 Z" fill="#E50914" />
        </svg>
      </div>
    ),
  },
  {
    id: 4,
    title: 'Support Student Developers',
    body: 'Upvote great projects, bookmark your favorites, and help the best ideas gain visibility.',
    icon: (
      /* 3D Dual Smiling Emoji Profile Avatars Graphic */
      <div style={{ position: 'relative', width: '68px', height: '60px' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle, rgba(236,72,153,0.6) 0%, rgba(229,9,20,0.5) 60%, transparent 100%)',
          filter: 'blur(10px)',
        }} />
        <svg width="68" height="60" viewBox="0 0 68 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'relative', zIndex: 2 }}>
          <defs>
            <linearGradient id="face-pink-grad" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFA6D5" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
            <linearGradient id="face-red-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF4D7D" />
              <stop offset="60%" stopColor="#E50914" />
              <stop offset="100%" stopColor="#88070F" />
            </linearGradient>
          </defs>

          {/* Background Pink Face */}
          <rect x="8" y="6" width="30" height="30" rx="8" fill="url(#face-pink-grad)" stroke="#FFFFFF" strokeWidth="1.2" />
          <circle cx="17" cy="18" r="2.2" fill="#4C1D95" />
          <circle cx="29" cy="18" r="2.2" fill="#4C1D95" />
          <path d="M19 25 Q23 29 27 25" stroke="#4C1D95" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Foreground Red Glowing Face */}
          <rect x="26" y="20" width="36" height="36" rx="9" fill="url(#face-red-grad)" stroke="#FFB7D5" strokeWidth="1.5" />
          <circle cx="36" cy="33" r="2.5" fill="#FFFFFF" />
          <circle cx="50" cy="33" r="2.5" fill="#FFFFFF" />
          <path d="M38 42 Q43 47 48 42" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      </div>
    ),
  },
]

export default function NetflixReasonCards() {
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  return (
    <section style={{
      padding: '3.5rem 1.5rem 4.5rem',
      background: '#141414',
      position: 'relative',
      boxSizing: 'border-box',
    }}>
      <div style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '0 2rem',
        boxSizing: 'border-box',
      }}>
        {/* Section Heading */}
        <h2 style={{
          fontSize: 'clamp(1.4rem, 3.5vw, 1.85rem)',
          fontWeight: 800,
          color: '#FFFFFF',
          letterSpacing: '-0.02em',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
        }}>
          <div style={{ width: '4px', height: '26px', background: '#E50914', borderRadius: '2px' }} />
          More reasons to join
        </h2>

        {/* 4 Cards Responsive Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
        }}>
          {CARDS_DATA.map(card => {
            const isHovered = hoveredId === card.id
            return (
              <div
                key={card.id}
                onMouseEnter={() => setHoveredId(card.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  background: 'linear-gradient(145deg, #191B2E 0%, #0E101D 100%)',
                  border: isHovered ? '1px solid rgba(236, 72, 153, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '1.1rem',
                  padding: '1.85rem 1.6rem 1.6rem',
                  minHeight: '290px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                  transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
                  boxShadow: isHovered
                    ? '0 16px 36px rgba(0, 0, 0, 0.85), 0 0 24px rgba(236, 72, 153, 0.2)'
                    : '0 8px 24px rgba(0, 0, 0, 0.5)',
                  transition: 'all 0.28s cubic-bezier(0.2, 0, 0, 1)',
                  boxSizing: 'border-box',
                }}
              >
                {/* Text Content */}
                <div>
                  <h3 style={{
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.25,
                    marginBottom: '0.85rem',
                  }}>
                    {card.title}
                  </h3>
                  <p style={{
                    fontSize: '0.92rem',
                    color: '#B3B5C6',
                    lineHeight: 1.5,
                    margin: 0,
                  }}>
                    {card.body}
                  </p>
                </div>

                {/* Bottom Right 3D Icon Graphic */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'flex-end',
                  marginTop: '1.5rem',
                  transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform 0.25s ease',
                }}>
                  {card.icon}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
