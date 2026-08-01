'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Globe, ChevronDown, UserPlus } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(signInError.message)
      setPending(false)
      return
    }

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('play_appflix_intro', 'true')
    }
    router.refresh()
    router.push('/?justLoggedIn=true')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'radial-gradient(ellipse at 50% 15%, rgba(135, 12, 20, 0.45) 0%, rgba(18, 12, 14, 0.95) 60%, #080808 100%)',
      color: '#FFFFFF',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* ── Netflix-style Top Header with distinct bottom border & margin ─ */}
      <header style={{
        padding: '1.25rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        maxWidth: '1360px',
        margin: '0 auto 1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxSizing: 'border-box',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <img
            src="/assets/app-logos/AppFlix_Name_logo_dark_-without_background.png"
            alt="AppFlix"
            style={{
              height: '140px',
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
              margin: '-30px 0 -30px -40px',
              transform: 'scale(1.35)',
              transformOrigin: 'left center',
            }}
          />
        </Link>
      </header>

      {/* ── Main Form Section ────────────────────────────────────── */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '1rem 1.5rem 4rem',
        boxSizing: 'border-box',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '480px',
          padding: '2.5rem 2.5rem 3rem',
          background: 'rgba(0, 0, 0, 0.55)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
          boxSizing: 'border-box',
        }}>
          {/* Title — single line */}
          <h1 style={{
            fontSize: 'clamp(1.35rem, 4vw, 1.75rem)',
            fontWeight: 800,
            color: '#FFFFFF',
            marginBottom: '0.4rem',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            Enter your info to sign in
          </h1>

          <p style={{
            fontSize: '0.9rem',
            color: '#AAAAAA',
            marginBottom: '1.75rem',
          }}>
            Sign in to access your student apps & dashboard.
          </p>

          {/* Error message */}
          {error && (
            <div style={{
              background: 'rgba(229, 9, 20, 0.15)',
              border: '1px solid rgba(229, 9, 20, 0.4)',
              borderRadius: '4px',
              padding: '0.85rem 1rem',
              color: '#FF6B6B',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
              lineHeight: 1.4,
            }}>
              {error}
            </div>
          )}

          {/* Sign in Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Email input box */}
            <div suppressHydrationWarning style={{
              background: 'rgba(22, 22, 22, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '4px',
              padding: '0.5rem 0.9rem 0.4rem',
            }}>
              <label htmlFor="email" style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#AAAAAA',
                marginBottom: '0.15rem',
              }}>
                Email or mobile number
              </label>
              {mounted ? (
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.95rem',
                    padding: '0.1rem 0 0.2rem',
                    fontFamily: 'inherit',
                  }}
                />
              ) : (
                <div style={{ height: '24px' }} />
              )}
            </div>

            {/* Password input box with visible Forgot Password link */}
            <div>
              <div suppressHydrationWarning style={{
                background: 'rgba(22, 22, 22, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                padding: '0.5rem 0.9rem 0.4rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="password" style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#AAAAAA',
                  }}>
                    Password
                  </label>
                  <Link href="/forgot-password" style={{
                    fontSize: '0.78rem',
                    color: '#E50914',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}>
                    Forgot password?
                  </Link>
                </div>
                {mounted ? (
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#FFFFFF',
                      fontSize: '0.95rem',
                      padding: '0.2rem 0 0.2rem',
                      fontFamily: 'inherit',
                    }}
                  />
                ) : (
                  <div style={{ height: '24px' }} />
                )}
              </div>
            </div>

            {/* Red Continue button */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={pending}
              style={{
                width: '100%',
                padding: '0.9rem',
                background: pending ? '#990000' : '#E50914',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '1rem',
                border: 'none',
                borderRadius: '4px',
                cursor: pending ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
                marginTop: '0.4rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
              onMouseEnter={e => { if (!pending) e.currentTarget.style.background = '#F40612' }}
              onMouseLeave={e => { if (!pending) e.currentTarget.style.background = '#E50914' }}
            >
              {pending ? <Loader2 size={18} className="animate-spin" /> : 'Continue'}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            margin: '1.75rem 0 1.25rem',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.15)' }} />
            <span style={{ color: '#888888', fontSize: '0.78rem', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.15)' }} />
          </div>

          {/* Prominent Create Account Button */}
          <Link
            href="/signup"
            id="login-create-account-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.85rem',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '4px',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.95rem',
              textDecoration: 'none',
              transition: 'background 0.2s, border-color 0.2s',
              boxSizing: 'border-box',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'
            }}
          >
            <UserPlus size={16} /> Create an Account
          </Link>

          {/* ReCAPTCHA Notice */}
          <p style={{
            color: '#777777',
            fontSize: '0.75rem',
            marginTop: '1.5rem',
            textAlign: 'center',
            lineHeight: 1.45,
          }}>
            This page is protected by Google reCAPTCHA to ensure you&apos;re not a bot.
          </p>
        </div>
      </main>

      {/* ── Footer ─────────────────────────────────── */}
      <footer style={{
        background: 'rgba(0, 0, 0, 0.85)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '2.5rem 2rem',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
        }}>
          <p style={{
            color: '#888888',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            lineHeight: 1.5,
          }}>
            AppFlix is an open showcase platform for university student projects, apps, and digital innovations.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1.25rem 2rem',
            marginBottom: '2rem',
          }}>
            <div>
              <p style={{ color: '#AAAAAA', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Platform</p>
              <p style={{ color: '#777777', fontSize: '0.8rem', lineHeight: 1.6 }}>Student Built & Owned<br />Free Showcase Platform<br />Peer Project Discovery</p>
            </div>
            <div>
              <p style={{ color: '#AAAAAA', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Community</p>
              <p style={{ color: '#777777', fontSize: '0.8rem', lineHeight: 1.6 }}>University Innovation<br />Real-time Upvotes<br />Developer Dashboards</p>
            </div>
            <div>
              <p style={{ color: '#AAAAAA', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quality & Safety</p>
              <p style={{ color: '#777777', fontSize: '0.8rem', lineHeight: 1.6 }}>Moderated App Queue<br />Verified Submissions<br />Safe Student Environment</p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '1.5rem',
          }}>
            <p style={{ color: '#666666', fontSize: '0.8rem' }}>
              © {new Date().getFullYear()} AppFlix • Built for student builders and innovators
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#141414',
              border: '1px solid #333333',
              borderRadius: '4px',
              padding: '0.45rem 0.9rem',
              color: '#888888',
              fontSize: '0.82rem',
            }}>
              <Globe size={14} /> English
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
