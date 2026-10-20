'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface GoogleSignInButtonProps {
  label?: string
  redirectToNext?: string
}

export default function GoogleSignInButton({
  label = 'Continue with Google',
  redirectToNext = '/'
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGoogleSignIn() {
    setLoading(true)
    setError(null)

    // Ensure intro animation flag is cleared for Google OAuth signins
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('play_appflix_intro')
      } catch {}
    }

    try {
      const supabase = createClient()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(redirectToNext)}`

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      })

      if (oauthError) {
        setError(oauthError.message)
        setLoading(false)
        return
      }

      if (data?.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize Google Sign-in')
      setLoading(false)
    }
  }

  return (
    <div style={{ width: '100%' }}>
      <button
        id="google-signin-btn"
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        style={{
          width: '100%',
          padding: '0.85rem',
          background: '#FFFFFF',
          color: '#1F1F1F',
          fontWeight: 600,
          fontSize: '0.95rem',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          boxSizing: 'border-box',
          opacity: loading ? 0.75 : 1,
        }}
        onMouseEnter={e => {
          if (!loading) {
            e.currentTarget.style.background = '#F0F0F0'
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.35)'
          }
        }}
        onMouseLeave={e => {
          if (!loading) {
            e.currentTarget.style.background = '#FFFFFF'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)'
          }
        }}
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" style={{ color: '#1F1F1F' }} />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              fill="#EA4335"
            />
          </svg>
        )}
        <span>{label}</span>
      </button>

      {error && (
        <div style={{
          marginTop: '0.6rem',
          fontSize: '0.8rem',
          color: '#FF6B6B',
          textAlign: 'center',
          lineHeight: 1.3,
        }}>
          {error}
        </div>
      )}
    </div>
  )
}
