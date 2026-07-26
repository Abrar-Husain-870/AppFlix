'use client'

interface NetflixHorizonDividerProps {
  fillColor?: string
}

export default function NetflixHorizonDivider({ fillColor = '#141414' }: NetflixHorizonDividerProps) {
  return (
    <>
      {/* Desktop Divider (Unchanged for screens > 768px) */}
      <div
        className="desktop-only"
        style={{
          position: 'relative',
          width: '100%',
          marginTop: '-140px',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: '140px' }}>
          <svg
            viewBox="0 0 1440 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '140px', zIndex: 4, display: 'block',
            }}
          >
            <defs>
              <clipPath id="secondSectionConvexClip">
                <path d="M -50,140 Q 720,12 1490,140 L 1490,200 L -50,200 Z" />
              </clipPath>

              <radialGradient id="electricBlueDome" cx="50%" cy="8%" r="60%" fx="50%" fy="8%">
                <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.22" />
                <stop offset="20%" stopColor="#3B82F6" stopOpacity="0.18" />
                <stop offset="48%" stopColor="#1E3A8A" stopOpacity="0.28" />
                <stop offset="78%" stopColor="#0F172A" stopOpacity="0.15" />
                <stop offset="100%" stopColor={fillColor} stopOpacity="0" />
              </radialGradient>

              <linearGradient id="netflixRedArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#800008" stopOpacity="0.1" />
                <stop offset="18%" stopColor="#C40912" stopOpacity="0.8" />
                <stop offset="42%" stopColor="#E50914" stopOpacity="1" />
                <stop offset="50%" stopColor="#FF333D" stopOpacity="1" />
                <stop offset="58%" stopColor="#E50914" stopOpacity="1" />
                <stop offset="82%" stopColor="#C40912" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#800008" stopOpacity="0.1" />
              </linearGradient>

              <filter id="neonRedGlow" x="-15%" y="-15%" width="130%" height="130%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path d="M -50,140 Q 720,12 1490,140 L 1490,200 L -50,200 Z" fill={fillColor} />
            <path d="M -50,140 Q 720,12 1490,140 L 1490,200 L -50,200 Z" fill="url(#electricBlueDome)" clipPath="url(#secondSectionConvexClip)" />
            <path d="M -50,140 Q 720,12 1490,140" stroke="url(#netflixRedArcGrad)" strokeWidth="4" strokeLinecap="round" filter="url(#neonRedGlow)" fill="none" />
          </svg>
        </div>
      </div>

      {/* Mobile Divider (Gentle curve sits neatly below content, blue ambient dome fades out 100% seamlessly) */}
      <div
        className="mobile-only"
        style={{
          position: 'relative',
          width: '100%',
          marginTop: '-30px',
          zIndex: 20,
          pointerEvents: 'none',
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: '100px' }}>
          <svg
            viewBox="0 0 1440 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100px', zIndex: 4, display: 'block',
            }}
          >
            <defs>
              <clipPath id="mobileSecondSectionConvexClip">
                <path d="M -50,30 Q 720,8 1490,30 L 1490,150 L -50,150 Z" />
              </clipPath>

              {/* Radial gradient fading out 100% to transparent/fillColor before reaching bottom edge */}
              <radialGradient id="mobileElectricBlueDome" cx="50%" cy="0%" r="85%" fx="50%" fy="0%">
                <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.22" />
                <stop offset="25%" stopColor="#3B82F6" stopOpacity="0.14" />
                <stop offset="50%" stopColor="#1E3A8A" stopOpacity="0.06" />
                <stop offset="70%" stopColor={fillColor} stopOpacity="0" />
                <stop offset="100%" stopColor={fillColor} stopOpacity="0" />
              </radialGradient>

              <linearGradient id="mobileRedArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#800008" stopOpacity="0.1" />
                <stop offset="25%" stopColor="#E50914" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#FF333D" stopOpacity="1" />
                <stop offset="75%" stopColor="#E50914" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#800008" stopOpacity="0.1" />
              </linearGradient>

              <filter id="mobileNeonGlow" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path d="M -50,30 Q 720,8 1490,30 L 1490,150 L -50,150 Z" fill={fillColor} />
            <path d="M -50,30 Q 720,8 1490,30 L 1490,150 L -50,150 Z" fill="url(#mobileElectricBlueDome)" clipPath="url(#mobileSecondSectionConvexClip)" />
            <path d="M -50,30 Q 720,8 1490,30" stroke="url(#mobileRedArcGrad)" strokeWidth="3" strokeLinecap="round" filter="url(#mobileNeonGlow)" fill="none" />
          </svg>
        </div>
      </div>
    </>
  )
}
