'use client'

import { useState, useEffect } from 'react'
import { Link2 } from 'lucide-react'

interface Props {
  projectName: string
  projectSlug: string
}

export default function ShareCard({ projectName, projectSlug }: Props) {
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  const baseUrl = `${origin}/browse/${projectSlug}`

  const shareText = `Check out ${projectName} on AppFlix!`

  function handleCopy() {
    navigator.clipboard.writeText(baseUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Social sharing links with UTMS
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(baseUrl + '?utm_source=x.com')}`
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(baseUrl + '?utm_source=facebook.com')}`
  const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + baseUrl + '?utm_source=whatsapp.com')}`
  const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(baseUrl + '?utm_source=linkedin.com')}`

  return (
    <div style={{
      background: 'linear-gradient(145deg, #0F0F0F 0%, #080808 100%)',
      border: '1px solid rgba(255, 255, 255, 0.07)',
      borderRadius: '0.75rem',
      padding: '1.25rem',
      marginBottom: '1rem',
    }}>
      <h3 style={{
        fontSize: '0.7rem',
        fontWeight: 800,
        color: '#777777',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: '0.85rem'
      }}>
        Share
      </h3>

      {/* Social Button Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.5rem',
        marginBottom: '0.85rem'
      }}>
        {/* X */}
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '42px', background: '#000000', border: '1px solid #2B2B2B',
            borderRadius: '0.5rem', textDecoration: 'none', transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '1rem', fontFamily: 'system-ui' }}>𝕏</span>
        </a>

        {/* Facebook */}
        <a
          href={fbUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '42px', background: '#1877F2', border: '1px solid #166FE5',
            borderRadius: '0.5rem', textDecoration: 'none', transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '1.1rem', fontFamily: 'serif' }}>f</span>
        </a>

        {/* WhatsApp */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '42px', background: '#25D366', border: '1px solid #20BA5A',
            borderRadius: '0.5rem', textDecoration: 'none', transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {/* Custom WhatsApp Icon using SVG */}
          <svg viewBox="0 0 24 24" width="18" height="18" fill="#FFFFFF">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97C16.638 2.052 14.17 1.02 11.56 1.02c-5.438 0-9.863 4.372-9.867 9.802-.001 1.736.486 3.427 1.41 4.933l-.974 3.556 3.638-.942c1.477.794 2.94 1.189 4.341 1.189v.001zM19.1 14.897c-.369-.185-2.185-1.077-2.523-1.2-.338-.121-.585-.183-.83 0-.246.368-.95 1.2-1.166 1.446-.215.244-.43.27-.798.087-.37-.185-1.562-.575-2.975-1.833-1.099-.98-1.84-2.19-2.055-2.559-.215-.37-.023-.57.162-.754.166-.166.369-.43.554-.645.185-.215.246-.369.369-.615.123-.246.062-.46-.031-.645-.093-.185-.83-2-1.137-2.74c-.3-.722-.603-.625-.83-.637-.215-.011-.461-.013-.707-.013-.246 0-.646.093-.984.46-.339.37-1.29 1.258-1.29 3.072 0 1.814 1.321 3.567 1.505 3.813.185.246 2.6 3.97 6.299 5.565.88.38 1.568.608 2.102.777.883.28 1.687.24 2.322.145.707-.107 2.185-.893 2.492-1.758.308-.865.308-1.607.216-1.76-.092-.152-.338-.244-.707-.429z"/>
          </svg>
        </a>

        {/* LinkedIn */}
        <a
          href={liUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '42px', background: '#0A66C2', border: '1px solid #00509E',
            borderRadius: '0.5rem', textDecoration: 'none', transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.95rem', fontFamily: 'sans-serif' }}>in</span>
        </a>
      </div>

      {/* Copy Link Button */}
      <button
        onClick={handleCopy}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
          padding: '0.65rem 1rem',
          background: copied ? '#E50914' : '#F5F5F5',
          border: copied ? '1px solid #E50914' : '1px solid #E5E7EB',
          color: copied ? '#FFFFFF' : '#1A1A1A',
          fontWeight: 700,
          fontSize: '0.8rem',
          borderRadius: '0.4rem',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <Link2 size={13} />
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  )
}
