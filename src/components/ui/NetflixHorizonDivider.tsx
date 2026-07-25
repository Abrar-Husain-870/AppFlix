'use client'

interface NetflixHorizonDividerProps {
  fillColor?: string
}

export default function NetflixHorizonDivider({ fillColor = '#141414' }: NetflixHorizonDividerProps) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      marginTop: '-140px',
      zIndex: 20,
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        height: '140px',
      }}>
        {/* Precision SVG Convex Section Header with Subtle Dark Blue Ambient Dome */}
        <svg
          viewBox="0 0 1440 140"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '140px',
            zIndex: 4,
            display: 'block',
          }}
        >
          <defs>
            {/* Convex Clipping Mask: Restricts rendering strictly BELOW the curve */}
            <clipPath id="secondSectionConvexClip">
              <path d="M -50,140 Q 720,12 1490,140 L 1490,200 L -50,200 Z" />
            </clipPath>

            {/* Subtle, Dark Ambient Blue Radial Glow Gradient (#121B3F / Deep Slate) */}
            <radialGradient id="electricBlueDome" cx="50%" cy="8%" r="60%" fx="50%" fy="8%">
              <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.22" />
              <stop offset="20%" stopColor="#3B82F6" stopOpacity="0.18" />
              <stop offset="48%" stopColor="#1E3A8A" stopOpacity="0.28" />
              <stop offset="78%" stopColor="#0F172A" stopOpacity="0.15" />
              <stop offset="100%" stopColor={fillColor} stopOpacity="0" />
            </radialGradient>

            {/* Horizontal Red Arc Line Gradient with Center Hotspot */}
            <linearGradient id="netflixRedArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#800008" stopOpacity="0.1" />
              <stop offset="18%" stopColor="#C40912" stopOpacity="0.8" />
              <stop offset="42%" stopColor="#E50914" stopOpacity="1" />
              <stop offset="50%" stopColor="#FF333D" stopOpacity="1" />
              <stop offset="58%" stopColor="#E50914" stopOpacity="1" />
              <stop offset="82%" stopColor="#C40912" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#800008" stopOpacity="0.1" />
            </linearGradient>

            {/* Drop Shadow Filter for Red Line */}
            <filter id="neonRedGlow" x="-15%" y="-15%" width="130%" height="130%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. Solid Base Fill matching section below */}
          <path
            d="M -50,140 Q 720,12 1490,140 L 1490,200 L -50,200 Z"
            fill={fillColor}
          />

          {/* 2. Subtle Dark Blue Ambient 3D Dome Layer (Clipped strictly below curve) */}
          <path
            d="M -50,140 Q 720,12 1490,140 L 1490,200 L -50,200 Z"
            fill="url(#electricBlueDome)"
            clipPath="url(#secondSectionConvexClip)"
          />

          {/* 3. Glowing Red Arc Line sitting precisely on top of the convex seam */}
          <path
            d="M -50,140 Q 720,12 1490,140"
            stroke="url(#netflixRedArcGrad)"
            strokeWidth="4"
            strokeLinecap="round"
            filter="url(#neonRedGlow)"
            fill="none"
          />
        </svg>
      </div>
    </div>
  )
}
