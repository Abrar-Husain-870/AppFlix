'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';

export interface CarouselItem {
  id: string | number;
  url: string;
  title?: string;
}

const DEFAULT_ITEMS: CarouselItem[] = [
  {
    id: 1,
    url: 'https://cdn.21st.dev/assets/mirror/2d/2deffad52dca4c5c60941eae33c675a62f8c68ccc59977c53841203b173abe0b.jpg',
    title: 'A large body of water surrounded by mountains',
  },
  {
    id: 2,
    url: 'https://cdn.21st.dev/assets/mirror/cd/cd19a496024e1ae95966db819275e556550318375c03775081270da8e8c67959.jpg',
    title: 'Abstract streaks of pink and blue on black',
  },
  {
    id: 3,
    url: 'https://cdn.21st.dev/assets/mirror/fd/fd0a79541180cd40e0ce44de54b408d0e340d8640f929a4b240255478919141f.jpg',
    title: 'Mountain Summit',
  },
  {
    id: 4,
    url: 'https://cdn.21st.dev/assets/mirror/8c/8c67f1501f4d1d639798bc474a764aac9cecf144810c4f6ecc1ea154622b8bff.jpg',
    title: 'Alpine Landscape',
  },
  {
    id: 5,
    url: 'https://cdn.21st.dev/assets/mirror/a8/a86021ac758a4511effa226afc0df66c2c515c1dd3b6d0f5a307c2098b3821d8.jpg',
    title: 'Mountain Range',
  },
  {
    id: 6,
    url: 'https://cdn.21st.dev/assets/mirror/7f/7f3a08eb3241cf6bc316407c3ea065bd25482e987ac32f399d7a2efb0fd65a28.jpg',
    title: 'Mountain Wilderness',
  },
  {
    id: 7,
    url: 'https://cdn.21st.dev/assets/mirror/6d/6d1ef0c6933c3e5af6cd341edf76c9241a1b9d8a7ce9cd5d27026b128be25899.jpg',
    title: 'Mountain Trail',
  },
  {
    id: 8,
    url: 'https://cdn.21st.dev/assets/mirror/3c/3cbffe91284f00277befa7adfb9d8ae1cb414f9526842ec6908bff339a35b115.jpg',
    title: 'A lone figure stands on a futuristic, reflective surface.',
  },
  {
    id: 9,
    url: 'https://cdn.21st.dev/assets/mirror/25/25fbf25543ef72d92c290e34e1c8aa8eb1a0c113e5b55f6bf6c1c7dc5da473e1.jpg',
    title: 'Rocky Cliffs',
  },
  {
    id: 10,
    url: 'https://cdn.21st.dev/assets/mirror/c4/c4557795d4c2efcbb582c25d9aca9f1d774376add6018f9718141993cf3b75c2.jpg',
    title: 'Forest Path',
  },
  {
    id: 11,
    url: 'https://cdn.21st.dev/assets/mirror/c8/c81fd183e7ec1c9302ae95a6f546f0b671b09164dc1cc9a24903814cfc72d643.jpg',
    title: 'Green Hills',
  },
  {
    id: 12,
    url: 'https://cdn.21st.dev/assets/mirror/d8/d8cbaa985a41cb934112ec5a1304545723b0fc96c6b14b450fc3c6029eebb0ae.jpg',
    title: 'Sunrise Peak',
  },
];

interface ThumbnailsProps {
  items: CarouselItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

function Thumbnails({ items, activeIndex, onSelect }: ThumbnailsProps) {
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Smoothly center the active thumbnail in the horizontal strip
  useEffect(() => {
    const activeBtn = btnRefs.current[activeIndex];
    if (activeBtn) {
      activeBtn.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeIndex]);

  // Prevent multi-touch pinch zoom on the thumbnail strip
  useEffect(() => {
    const el = thumbnailsRef.current;
    if (!el) return;

    const handleTouch = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 1 && e.cancelable) {
        e.preventDefault();
      }
    };
    const handleGesture = (e: Event) => {
      if (e.cancelable) e.preventDefault();
    };

    el.addEventListener('touchstart', handleTouch, { passive: false });
    el.addEventListener('touchmove', handleTouch, { passive: false });
    el.addEventListener('gesturestart', handleGesture);
    el.addEventListener('gesturechange', handleGesture);

    return () => {
      el.removeEventListener('touchstart', handleTouch);
      el.removeEventListener('touchmove', handleTouch);
      el.removeEventListener('gesturestart', handleGesture);
      el.removeEventListener('gesturechange', handleGesture);
    };
  }, []);

  if (items.length <= 1) return null;

  return (
    <div
      ref={thumbnailsRef}
      className='product-gallery-thumbnails overflow-x-auto w-full no-scrollbar py-2.5 px-2 overscroll-x-contain'
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-x',
        maxWidth: '100%',
      }}
    >
      <style>{`
        .overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className='flex gap-2 sm:gap-2.5 items-center mx-auto' style={{ width: 'fit-content' }}>
        {items.map((item, i) => {
          const isActive = i === activeIndex;
          return (
            <motion.button
              key={item.id}
              ref={(el) => {
                btnRefs.current[i] = el;
              }}
              type='button'
              onClick={() => onSelect(i)}
              whileHover={{ scale: isActive ? 1.05 : 1.03 }}
              whileTap={{ scale: 0.97 }}
              animate={{
                scale: isActive ? 1.05 : 1,
              }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={{
                height: '52px',
                padding: 0,
                margin: 0,
                border: 'none',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {/* Thumbnail Image: strictly constrained height, width, and rounded border */}
              <img
                src={item.url}
                alt={item.title || `Thumbnail ${i + 1}`}
                style={{
                  height: '48px',
                  maxHeight: '48px',
                  width: 'auto',
                  maxWidth: '80px',
                  objectFit: 'cover',
                  display: 'block',
                  borderRadius: '8px',
                  border: isActive ? '2px solid #E50914' : '2px solid rgba(255, 255, 255, 0.15)',
                  opacity: isActive ? 1 : 0.45,
                  filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.85))',
                  userSelect: 'none',
                  pointerEvents: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                }}
                draggable={false}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    scale: 0.98,
  }),
};

export interface ThumbnailCarouselProps {
  items?: CarouselItem[];
  className?: string;
  onImageClick?: (item: CarouselItem, index: number) => void;
}

export default function ThumbnailCarousel({
  items: userItems,
  className = '',
  onImageClick,
}: ThumbnailCarouselProps = {}) {
  // Page tracks continuous linear navigation (-inf to +inf) with direction (+1 or -1)
  const [[page, direction], setPage] = useState<[number, number]>([0, 0]);

  // If user passes items explicitly, use them; otherwise use default demo items
  const items = userItems !== undefined ? userItems : DEFAULT_ITEMS;

  if (!items || items.length === 0) {
    return null;
  }

  // Modulo wrap-around so index is always valid between 0 and items.length - 1
  const imageIndex = ((page % items.length) + items.length) % items.length;
  const activeItem = items[imageIndex];
  const hasMultiple = items.length > 1;

  // Container ref for touch gesture management & directional lock
  const containerRef = useRef<HTMLDivElement>(null);

  // Distinguish between swiping/dragging and clicking
  const hasDraggedRef = useRef(false);

  // Gesture handling:
  // 1. Prevent pinch to zoom on images (multi-touch & gesture events)
  // 2. Prevent page vertical scrolling / horizontal shifting while swiping horizontally
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let isHorizontalGesture = false;
    let isVerticalGesture = false;

    const handleTouchStart = (e: TouchEvent) => {
      // Block multi-touch pinch gestures
      if (e.touches && e.touches.length > 1) {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.touches && e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isHorizontalGesture = false;
        isVerticalGesture = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Block multi-touch pinch in progress
      if (e.touches && e.touches.length > 1) {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (e.touches && e.touches.length === 1) {
        const dx = Math.abs(e.touches[0].clientX - startX);
        const dy = Math.abs(e.touches[0].clientY - startY);

        if (!isHorizontalGesture && !isVerticalGesture) {
          if (dx >= dy && dx > 1) {
            isHorizontalGesture = true;
          } else if (dy > dx && dy > 1) {
            isVerticalGesture = true;
          }
        }

        // If user is swiping horizontally, stop event propagation and cancel default scroll/shift
        if (isHorizontalGesture) {
          if (e.cancelable) {
            e.preventDefault();
          }
          e.stopPropagation();
        }
      }
    };

    const handleGesture = (e: Event) => {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('gesturestart', handleGesture);
    el.addEventListener('gesturechange', handleGesture);
    el.addEventListener('gestureend', handleGesture);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('gesturestart', handleGesture);
      el.removeEventListener('gesturechange', handleGesture);
      el.removeEventListener('gestureend', handleGesture);
    };
  }, []);

  // Infinite directional pagination
  const paginate = (newDirection: number) => {
    setPage(([prevPage]) => [prevPage + newDirection, newDirection]);
  };

  // Jump to specific thumbnail while taking the shortest direction
  const handleSelectThumbnail = (targetIndex: number) => {
    if (targetIndex === imageIndex) return;
    let diff = targetIndex - imageIndex;
    if (diff > items.length / 2) diff -= items.length;
    if (diff < -items.length / 2) diff += items.length;
    const dir = diff >= 0 ? 1 : -1;
    setPage(([prevPage]) => [prevPage + diff, dir]);
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`} style={{ maxWidth: '100%', overflowX: 'clip' }}>
      <div className='flex flex-col gap-3' style={{ maxWidth: '100%', overflowX: 'clip' }}>
        {/* Main Infinite Carousel Container */}
        <div
          ref={containerRef}
          className='relative rounded-xl bg-transparent w-full'
          style={{
            touchAction: 'pan-y',
            height: 'clamp(340px, 60vh, 580px)',
            maxWidth: '100%',
            width: '100%',
            overflow: 'clip',
            contain: 'paint',
            WebkitMaskImage: '-webkit-radial-gradient(white, black)',
          }}
        >
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={page}
              custom={direction}
              variants={slideVariants}
              initial='enter'
              animate='center'
              exit='exit'
              transition={{
                x: { type: 'spring', stiffness: 320, damping: 32 },
                opacity: { duration: 0.22 },
                scale: { duration: 0.22 },
              }}
              drag={hasMultiple ? 'x' : false}
              dragDirectionLock={true}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.65}
              style={{ touchAction: 'pan-y', maxWidth: '100%', width: '100%', overflow: 'clip' }}
              onDragStart={() => {
                hasDraggedRef.current = true;
              }}
              onDragEnd={(_e, info: PanInfo) => {
                const offset = info.offset.x;
                const velocity = info.velocity.x;

                // Swipe left -> next image (infinite)
                if (offset < -35 || velocity < -300) {
                  paginate(1);
                }
                // Swipe right -> previous image (infinite)
                else if (offset > 35 || velocity > 300) {
                  paginate(-1);
                }

                // Prevent trailing click event from opening lightbox after dragging
                setTimeout(() => {
                  hasDraggedRef.current = false;
                }, 100);
              }}
              className='absolute inset-0 w-full h-full flex items-center justify-center p-2 sm:p-4 md:p-5 select-none cursor-grab active:cursor-grabbing'
              onClick={() => {
                if (hasDraggedRef.current) return;
                if (onImageClick) {
                  onImageClick(activeItem, imageIndex);
                }
              }}
            >
              {/* Foreground Image: 100% uncropped with deep floating drop shadow */}
              <img
                src={activeItem.url}
                alt={activeItem.title || `App Screen ${imageIndex + 1}`}
                className={`relative z-10 max-h-full max-w-full object-contain rounded-xl select-none transition-transform duration-200 ${
                  onImageClick ? 'cursor-pointer hover:scale-[1.015]' : ''
                }`}
                style={{
                  filter:
                    'drop-shadow(0 24px 38px rgba(0, 0, 0, 0.88)) drop-shadow(0 8px 16px rgba(0, 0, 0, 0.65))',
                  pointerEvents: 'none',
                  touchAction: 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitTouchCallout: 'none',
                }}
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>

          {/* Static Left Arrow Button — Responsive on mobile */}
          {hasMultiple && (
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation();
                paginate(-1);
              }}
              aria-label='Previous slide'
              className='absolute left-1.5 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.9)] bg-black/75 hover:bg-[#E50914] text-white backdrop-blur-md border border-white/20 hover:border-[#E50914] hover:scale-110 opacity-90 hover:opacity-100 cursor-pointer transition-all z-30'
            >
              <svg
                className='w-4 h-4 sm:w-5 sm:h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2.5}
                  d='M15 19l-7-7 7-7'
                />
              </svg>
            </button>
          )}

          {/* Static Right Arrow Button — Responsive on mobile */}
          {hasMultiple && (
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation();
                paginate(1);
              }}
              aria-label='Next slide'
              className='absolute right-1.5 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.9)] bg-black/75 hover:bg-[#E50914] text-white backdrop-blur-md border border-white/20 hover:border-[#E50914] hover:scale-110 opacity-90 hover:opacity-100 cursor-pointer transition-all z-30'
            >
              <svg
                className='w-4 h-4 sm:w-5 sm:h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2.5}
                  d='M9 5l7 7-7 7'
                />
              </svg>
            </button>
          )}

          {/* Image Counter Badge — Dynamic Wrap-around */}
          {hasMultiple && (
            <div className='absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white/95 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wider border border-white/15 shadow-xl z-20 pointer-events-none'>
              {imageIndex + 1} / {items.length}
            </div>
          )}
        </div>

        {/* Thumbnail Navigation Strip with Active Auto-center */}
        <Thumbnails
          items={items}
          activeIndex={imageIndex}
          onSelect={handleSelectThumbnail}
        />
      </div>
    </div>
  );
}
