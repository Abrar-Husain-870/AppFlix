'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function HeroPosterWall() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Only active on pages that show the 3D Poster Wall Hero
  const isHeroPage = pathname === '/' || pathname === '/browse'

  if (!mounted) return null

  return (
    <div
      id="appflix-persistent-hero-poster-wall"
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: '60px',
        left: 0,
        width: '100%',
        height: pathname === '/browse' ? '100vh' : '780px',
        maxHeight: pathname === '/browse' ? '860px' : '780px',
        minHeight: '580px',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        opacity: isHeroPage ? 1 : 0,
        visibility: isHeroPage ? 'visible' : 'hidden',
        transition: 'opacity 0.2s ease, visibility 0.2s ease',
      }}
    >
      <iframe
        src="/bg-standalone.html"
        title="AppFlix 3D Wall Background"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
