'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { signUp } from '@/app/actions/auth'
import { Loader2, Globe, ChevronDown, LogIn } from 'lucide-react'

export default function SignupPage() {
  const [state, action, pending] = useActionState(signUp, undefined)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [clientError, setClientError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (password !== confirmPassword) {
      e.preventDefault()
      setClientError('Passwords do not match.')
      return
    }
    setClientError(null)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('play_appflix_intro', 'true')
    }
  }

  const errorMessage = clientError || state?.error

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'radial-gradient(ellipse at 50% 15%, rgba(135, 12, 20, 0.45) 0%, rgba(18, 12, 14, 0.95) 60%, #080808 100%)',
      color: '#FFFFFF',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* ── Netflix-style Top Header ───────────────────────────────── */}
      <header style={{
        padding: '2rem 3.5rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        maxWidth: '1360px',
        margin: '0 auto 3rem',
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

      {/* ── Main Section ────────────────────────────────────────── */}
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
          <h1 style={{
            fontSize: 'clamp(1.35rem, 4vw, 1.75rem)',
            fontWeight: 800,
            color: '#FFFFFF',
            marginBottom: '0.4rem',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
          }}>
            Create your account
          </h1>

          <p style={{
            fontSize: '0.9rem',
            color: '#AAAAAA',
            marginBottom: '1.75rem',
          }}>
            Showcase your university projects to the world.
          </p>

          {/* Error banner */}
          {errorMessage && (
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
              {errorMessage}
            </div>
          )}

          <form action={action} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Email */}
            <div suppressHydrationWarning style={{
              background: 'rgba(22, 22, 22, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '4px',
              padding: '0.5rem 0.9rem 0.4rem',
            }}>
              <label htmlFor="signup-email" style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#AAAAAA',
                marginBottom: '0.15rem',
              }}>
                Email address
              </label>
              {mounted ? (
                <input
                  id="signup-email"
                  name="email"
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

            {/* Set Password */}
            <div suppressHydrationWarning style={{
              background: 'rgba(22, 22, 22, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '4px',
              padding: '0.5rem 0.9rem 0.4rem',
            }}>
              <label htmlFor="signup-password" style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#AAAAAA',
                marginBottom: '0.15rem',
              }}>
                Set Password (min. 8 characters)
              </label>
              {mounted ? (
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
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

            {/* Confirm Password */}
            <div suppressHydrationWarning style={{
              background: 'rgba(22, 22, 22, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '4px',
              padding: '0.5rem 0.9rem 0.4rem',
            }}>
              <label htmlFor="signup-confirm-password" style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 500,
                color: '#AAAAAA',
                marginBottom: '0.15rem',
              }}>
                Confirm Password
              </label>
              {mounted ? (
                <input
                  id="signup-confirm-password"
                  name="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
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

            {/* Submit button */}
            <button
              id="signup-submit-btn"
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
              {pending ? <Loader2 size={18} className="animate-spin" /> : 'Create Account & Enter'}
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
            <span style={{ color: '#888888', fontSize: '0.78rem', fontWeight: 600 }}>ALREADY HAVE AN ACCOUNT?</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.15)' }} />
          </div>

          {/* Sign In button */}
          <Link
            href="/login"
            id="signup-login-btn"
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
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
              transition: 'background 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'
            }}
          >
            <LogIn size={16} /> Sign In Instead
          </Link>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer style={{
        padding: '2rem 1.5rem',
        background: 'rgba(0, 0, 0, 0.75)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        fontSize: '0.82rem',
        color: '#777777',
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}>
          <p style={{ margin: 0 }}>Questions? Contact AppFlix Support</p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '0.75rem',
          }}>
            <Link href="/" style={{ color: '#777777', textDecoration: 'none' }}>FAQ</Link>
            <Link href="/" style={{ color: '#777777', textDecoration: 'none' }}>Help Center</Link>
            <Link href="/" style={{ color: '#777777', textDecoration: 'none' }}>Terms of Use</Link>
            <Link href="/" style={{ color: '#777777', textDecoration: 'none' }}>Privacy</Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={14} />
            <select
              defaultValue="en"
              style={{
                background: '#000000',
                color: '#AAAAAA',
                border: '1px solid #333333',
                padding: '0.3rem 0.6rem',
                borderRadius: '4px',
                fontSize: '0.8rem',
                outline: 'none',
              }}
            >
              <option value="en">English</option>
            </select>
          </div>

          <p style={{ margin: 0, fontSize: '0.75rem', color: '#555555' }}>
            AppFlix India · Student Innovation Showcase
          </p>
        </div>
      </footer>
    </div>
  )
}
