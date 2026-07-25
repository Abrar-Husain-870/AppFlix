'use client'

import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react'

interface Screenshot {
  id: string
  image_url: string
}

interface ProductGalleryProps {
  screenshots: Screenshot[]
  projectName: string
}

export default function ProductGallery({ screenshots, projectName }: ProductGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const checkScroll = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setShowLeftArrow(scrollLeft > 10)
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [screenshots])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const scrollAmount = direction === 'left' ? -380 : 380
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  if (!screenshots || screenshots.length === 0) return null

  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <h2 style={{
        fontSize: '1.1rem',
        fontWeight: 800,
        color: '#FFFFFF',
        marginBottom: '1rem',
        letterSpacing: '-0.01em',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        <div style={{ width: '3px', height: '16px', background: '#E50914', borderRadius: '2px' }} />
        Product Gallery ({screenshots.length})
      </h2>

      {/* Gallery Container with Arrows */}
      <div style={{ position: 'relative', width: '100%' }}>
        {/* Left Arrow Button */}
        {showLeftArrow && (
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            style={{
              position: 'absolute',
              left: '-12px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              width: '36px',
              height: '56px',
              background: 'rgba(15, 15, 15, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#E50914'
              e.currentTarget.style.borderColor = '#E50914'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(15, 15, 15, 0.85)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
            }}
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {/* Right Arrow Button */}
        {showRightArrow && (
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            style={{
              position: 'absolute',
              right: '-12px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              width: '36px',
              height: '56px',
              background: 'rgba(15, 15, 15, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#E50914'
              e.currentTarget.style.borderColor = '#E50914'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(15, 15, 15, 0.85)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
            }}
          >
            <ChevronRight size={22} />
          </button>
        )}

        {/* Scroll Track */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          style={{
            display: 'flex',
            gap: '1rem',
            overflowX: 'auto',
            overflowY: 'hidden',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            padding: '0.4rem 4px 1rem 4px',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
          }}
          className="no-scrollbar"
        >
          {screenshots.map((img, idx) => (
            <div
              key={img.id || idx}
              onClick={() => setSelectedImage(img.image_url)}
              style={{
                position: 'relative',
                flexShrink: 0,
                height: '240px',
                borderRadius: '0.75rem',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: '#1A1A1A',
                cursor: 'pointer',
                scrollSnapAlign: 'start',
                transition: 'all 0.25s ease',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#E50914'
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(229, 9, 20, 0.35)'
                const overlay = e.currentTarget.querySelector('.zoom-overlay') as HTMLElement
                if (overlay) overlay.style.opacity = '1'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.5)'
                const overlay = e.currentTarget.querySelector('.zoom-overlay') as HTMLElement
                if (overlay) overlay.style.opacity = '0'
              }}
            >
              <img
                src={img.image_url}
                alt={`${projectName} screenshot ${idx + 1}`}
                style={{
                  height: '100%',
                  width: 'auto',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              {/* Zoom Hover Overlay */}
              <div
                className="zoom-overlay"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.45)',
                  backdropFilter: 'blur(2px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s ease',
                  color: '#FFFFFF',
                }}
              >
                <div style={{
                  background: '#E50914',
                  borderRadius: '50%',
                  padding: '0.6rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(229, 9, 20, 0.5)',
                }}>
                  <Maximize2 size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <button
            onClick={() => setSelectedImage(null)}
            aria-label="Close image preview"
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#E50914'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
          >
            <X size={24} />
          </button>

          <img
            src={selectedImage}
            alt={`${projectName} enlarged screenshot`}
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              borderRadius: '0.75rem',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(229, 9, 20, 0.25)',
              objectFit: 'contain',
              border: '1px solid rgba(255, 255, 255, 0.15)',
            }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
