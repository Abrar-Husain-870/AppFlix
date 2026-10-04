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
