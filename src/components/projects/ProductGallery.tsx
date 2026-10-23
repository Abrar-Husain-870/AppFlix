'use client'

import { useState, useEffect } from 'react'
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
    x: dir > 0 ? 400 : dir < 0 ? -400 : 0,
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
    x: dir < 0 ? 400 : -400,
    opacity: 0,
    scale: 0.96,
  }),
}

export default function ProductGallery({ screenshots, projectName }: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [direction, setDirection] = useState(0)

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

  // Prevent background page scrolling on mobile while modal is open
  useEffect(() => {
    if (selectedIndex !== null) {
      const originalOverflow = document.body.style.overflow
      const originalTouchAction = document.body.style.touchAction
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
      return () => {
        document.body.style.overflow = originalOverflow
        document.body.style.touchAction = originalTouchAction
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
      {selectedIndex !== null && currentScreenshot && (
        <div
          onClick={() => setSelectedIndex(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.94)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setSelectedIndex(null)}
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
              transition: 'all 0.2s ease',
              zIndex: 10002,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#E50914'
              e.currentTarget.style.transform = 'scale(1.08)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <X size={24} />
          </button>

          {/* Fullscreen Left Arrow Button */}
          {hasMultiple && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              style={{
                position: 'absolute',
                left: '1.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10002,
                width: '48px',
                height: '48px',
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
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Fullscreen Right Arrow Button */}
          {hasMultiple && (
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              style={{
                position: 'absolute',
                right: '1.5rem',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10002,
                width: '48px',
                height: '48px',
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
              <ChevronRight size={28} />
            </button>
          )}

          {/* Swipeable Fullscreen Slide View */}
          <div
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
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
                dragElastic={0.45}
                style={{ touchAction: 'none' }}
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
                className="absolute inset-0 flex items-center justify-center p-4 sm:p-10 select-none cursor-grab active:cursor-grabbing"
              >
                <img
                  src={currentScreenshot.image_url}
                  alt={`${projectName} screenshot ${selectedIndex + 1}`}
                  style={{
                    maxWidth: '85vw',
                    maxHeight: '82vh',
                    borderRadius: '0.75rem',
                    boxShadow: '0 24px 60px rgba(0, 0, 0, 0.95), 0 0 30px rgba(0, 0, 0, 0.8)',
                    objectFit: 'contain',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    userSelect: 'none',
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
                position: 'absolute',
                bottom: '1.5rem',
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
                zIndex: 10001,
              }}
            >
              {selectedIndex + 1} / {screenshots.length}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
