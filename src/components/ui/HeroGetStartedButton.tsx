'use client'

import Link from 'next/link'

export default function HeroGetStartedButton() {
  return (
    <Link
      href="/browse"
      id="hero-browse-btn"
      style={{
        padding: '1rem 1.75rem',
        background: '#E50914',
        border: 'none',
        borderRadius: '0 4px 4px 0',
        color: '#FFFFFF',
        fontWeight: 700,
        fontSize: '1.15rem',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        transition: 'background 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#F40612')}
      onMouseLeave={e => (e.currentTarget.style.background = '#E50914')}
    >
      Get Started ›
    </Link>
  )
}
