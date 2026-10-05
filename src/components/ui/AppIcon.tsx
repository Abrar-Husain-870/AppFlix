'use client'

import React, { useState } from 'react'

export interface AppIconProps {
  src?: string | null
  alt: string
  size?: number
  className?: string
  style?: React.CSSProperties
  imageStyle?: React.CSSProperties
  fallbackText?: string
  innerPadding?: number | string
  borderless?: boolean
  priority?: boolean
}

/**
 * AppIcon provides a unified, consistent 1:1 square icon container
 * across all views in AppFlix (Trending Now, Browse, Details, Dashboard, Admin).
 *
 * Guarantees:
 * - 1:1 fixed aspect ratio
 * - Apple/Netflix standard squircle border radius (22%)
 * - Subtle neutral dark background (#161616) suited to AppFlix dark theme
 * - object-fit: contain to prevent logo cropping/stretching
 * - Transparent and dark logo preservation
 * - Graceful fallback on missing/broken images
 */
export default function AppIcon({
  src,
  alt,
  size = 54,
  className = '',
  style,
  imageStyle,
  fallbackText,
  innerPadding = 0,
  borderless = false,
}: AppIconProps) {
  const [imageError, setImageError] = useState(false)

  // Standard squircle curvature: ~22% of dimension
  const borderRadius = Math.max(6, Math.round(size * 0.22))

  const isSamplePlaceholder =
    !fallbackText ||
    fallbackText.trim() === '' ||
    fallbackText === 'Your App Name' ||
    fallbackText.toLowerCase() === 'app icon' ||
    fallbackText.toLowerCase().includes('sample') ||
    fallbackText.toLowerCase().includes('choose')

  const initial = (fallbackText || alt || '?').trim().charAt(0).toUpperCase()

  const showImage = Boolean(src) && !imageError

  return (
    <div
      className={`appflix-app-icon ${className}`.trim()}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        borderRadius: `${borderRadius}px`,
        background: '#161616',
        border: borderless ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxSizing: 'border-box',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.45)',
        ...style,
      }}
    >
      {showImage ? (
        <img
          src={src!}
          alt={alt}
          onError={() => setImageError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            padding: typeof innerPadding === 'number' ? `${innerPadding}px` : innerPadding,
            boxSizing: 'border-box',
            ...imageStyle,
          }}
          loading="lazy"
        />
      ) : isSamplePlaceholder ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #222222 0%, #121212 100%)',
            border: '1.5px dashed rgba(255, 255, 255, 0.25)',
            borderRadius: `${borderRadius}px`,
            padding: '2px',
            boxSizing: 'border-box',
            userSelect: 'none',
          }}
        >
          <svg
            width={Math.max(16, Math.round(size * 0.36))}
            height={Math.max(16, Math.round(size * 0.36))}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#E50914"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginBottom: size >= 54 ? '2px' : 0 }}
          >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
          {size >= 48 && (
            <span
              style={{
                fontSize: `${Math.max(6.5, Math.round(size * 0.11))}px`,
                fontWeight: 700,
                color: '#AAAAAA',
                letterSpacing: '0.02em',
                lineHeight: 1.1,
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {size >= 58 ? 'Choose Icon' : 'Choose'}
            </span>
          )}
        </div>
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #222222 0%, #141414 100%)',
            color: '#E50914',
            fontWeight: 800,
            fontSize: `${Math.max(14, Math.round(size * 0.42))}px`,
            userSelect: 'none',
          }}
        >
          {initial}
        </div>
      )}
    </div>
  )
}
