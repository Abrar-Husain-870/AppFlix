'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence, type PanInfo } from 'framer-motion'
import ThumbnailCarousel from '@/components/ui/thumbnail-carousel'

interface Screenshot {
  id: string
  image_url: string
}

interface ProductGalleryProps {
  screenshots: Screenshot[]
  projectName: string
}

const fullscreenVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? '100%' : dir < 0 ? '-100%' : 0,
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (dir: number) => ({
    zIndex: 0,
    x: dir < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.96,
  }),
}

export default function ProductGallery({ screenshots, projectName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [direction, setDirection] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!screenshots || screenshots.length === 0) return null

  const carouselItems = screenshots.map((img, idx) => ({
    id: img.id || idx,
    url: img.image_url,
    title: `${projectName} screenshot ${idx + 1}`,
  }))

  const hasMultiple = screenshots.length > 1

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setDirection(-1)
    setSelectedIndex((prev) =>
      prev !== null ? (prev - 1 + screenshots.length) % screenshots.length : 0
    )
  }

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setDirection(1)
    setSelectedIndex((prev) =>
      prev !== null ? (prev + 1) % screenshots.length : 0
    )
  }

  // Prevent background page scrolling & pinch gestures on mobile while modal is open
  useEffect(() => {
    if (selectedIndex !== null) {
      const originalOverflow = document.body.style.overflow
      const originalTouchAction = document.body.style.touchAction
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'

      const preventMultiTouch = (e: TouchEvent) => {
        if (e.touches && e.touches.length > 1 && e.cancelable) {
          e.preventDefault()
        }
      }
      const preventGesture = (e: Event) => {
        if (e.cancelable) e.preventDefault()
      }

      window.addEventListener('touchstart', preventMultiTouch, { passive: false })
      window.addEventListener('touchmove', preventMultiTouch, { passive: false })
      window.addEventListener('gesturestart', preventGesture)
      window.addEventListener('gesturechange', preventGesture)

      return () => {
        document.body.style.overflow = originalOverflow
        document.body.style.touchAction = originalTouchAction
        window.removeEventListener('touchstart', preventMultiTouch)
        window.removeEventListener('touchmove', preventMultiTouch)
        window.removeEventListener('gesturestart', preventGesture)
        window.removeEventListener('gesturechange', preventGesture)
      }
    }
  }, [selectedIndex])

  // Keyboard navigation inside fullscreen modal (Left, Right, Escape)
  useEffect(() => {
    if (selectedIndex === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedIndex(null)
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, screenshots.length])

  const currentScreenshot =
    selectedIndex !== null ? screenshots[selectedIndex] : null

  return (
    <div style={{ marginBottom: '2.5rem', width: '100%', maxWidth: '100%', overflowX: 'clip' }}>
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
        App Preview ({screenshots.length})
      </h2>

      {/* Modern Thumbnail Carousel Showcase */}
      <ThumbnailCarousel
        items={carouselItems}
        onImageClick={(_item, idx) => {
          setDirection(0)
          setSelectedIndex(idx)
        }}
      />

      {/* Fullscreen Lightbox Modal with Full Touch/Mouse Swipe & Navigation */}
      {mounted && selectedIndex !== null && currentScreenshot && createPortal(
        <div
          id="fullscreen-lightbox-modal"
          onClick={() => setSelectedIndex(null)}
          style={{
            position: 'fixed',
            inset: 0,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100dvh',
            zIndex: 999999,
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            boxSizing: 'border-box',
            margin: 0,
            padding: 0,
          }}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedIndex(null)
            }}
            aria-label="Close image preview"
            style={{
              position: 'fixed',
              top: 'clamp(1rem, 2.5vw, 1.75rem)',
              right: 'clamp(1rem, 2.5vw, 1.75rem)',
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              zIndex: 1000005,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.8)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#E50914'
              e.currentTarget.style.borderColor = '#E50914'
              e.currentTarget.style.transform = 'scale(1.08)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.75)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <X size={22} />
          </button>

          {/* Fullscreen Left Arrow Button */}
          {hasMultiple && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              style={{
                position: 'fixed',
                left: 'clamp(0.75rem, 2vw, 2rem)',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1000005,
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.9)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#E50914'
                e.currentTarget.style.borderColor = '#E50914'
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.75)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
              }}
            >
              <ChevronLeft size={26} />
            </button>
          )}

          {/* Fullscreen Right Arrow Button */}
          {hasMultiple && (
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              style={{
                position: 'fixed',
                right: 'clamp(0.75rem, 2vw, 2rem)',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 1000005,
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.9)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#E50914'
                e.currentTarget.style.borderColor = '#E50914'
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.75)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
              }}
            >
              <ChevronRight size={26} />
            </button>
          )}

          {/* Swipeable Fullscreen Slide View */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
            onClick={() => setSelectedIndex(null)}
          >
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={selectedIndex}
                custom={direction}
                variants={fullscreenVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: 'spring', stiffness: 320, damping: 32 },
                  opacity: { duration: 0.22 },
                  scale: { duration: 0.22 },
                }}
                drag={hasMultiple ? 'x' : false}
                dragDirectionLock={true}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                style={{
                  position: 'absolute',
                  inset: 0,
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 'clamp(0.75rem, 3vw, 2.5rem)',
                  boxSizing: 'border-box',
                  touchAction: 'none',
                  cursor: hasMultiple ? 'grab' : 'default',
                }}
                onDragEnd={(_e, info: PanInfo) => {
                  const offset = info.offset.x
                  const velocity = info.velocity.x

                  // Swipe left -> next image
                  if (offset < -35 || velocity < -300) {
                    handleNext()
                  }
                  // Swipe right -> previous image
                  else if (offset > 35 || velocity > 300) {
                    handlePrev()
                  }
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={currentScreenshot.image_url}
                  alt={`${projectName} screenshot ${selectedIndex + 1}`}
                  style={{
                    maxWidth: 'min(92vw, 1300px)',
                    maxHeight: 'min(82vh, 82dvh)',
                    width: 'auto',
                    height: 'auto',
                    borderRadius: '0.75rem',
                    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(0, 0, 0, 0.8)',
                    objectFit: 'contain',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                    touchAction: 'none',
                    pointerEvents: 'none',
                  }}
                  draggable={false}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Fullscreen Counter Badge */}
          {hasMultiple && (
            <div
              style={{
                position: 'fixed',
                bottom: 'clamp(1rem, 2.5vw, 1.75rem)',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.8)',
                backdropFilter: 'blur(8px)',
                color: 'rgba(255, 255, 255, 0.95)',
                padding: '0.35rem 1rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.05em',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.8)',
                pointerEvents: 'none',
                zIndex: 1000004,
              }}
            >
              {selectedIndex + 1} / {screenshots.length}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
