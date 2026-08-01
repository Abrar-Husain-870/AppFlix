'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle, Lock } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, setPending] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setPending(true)
    const supabase = createClient()
    const { error: updateErr } = await supabase.auth.updateUser({ password })

    if (updateErr) {
      setError(updateErr.message)
      setPending(false)
      return
    }

    setSuccess(true)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('play_appflix_intro', 'true')
    }

    setTimeout(() => {
      router.refresh()
      router.push('/?justLoggedIn=true')
    }, 1500)
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
      {/* ── Header ───────────────────────────────── */}
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
          {success ? (
            /* Success confirmation */
            <div style={{ textAlign: 'center' }}>
              <CheckCircle size={52} style={{ color: '#2ECC71', margin: '0 auto 1.25rem' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.5rem' }}>
                Password Updated!
              </h2>
              <p style={{ color: '#CCCCCC', fontSize: '0.95rem', lineHeight: 1.6 }}>
                Your password has been reset successfully. Redirecting you into AppFlix…
              </p>
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                <Loader2 size={24} className="animate-spin" style={{ color: '#E50914' }} />
              </div>
            </div>
          ) : (
            /* Form */
            <>
              <h1 style={{
                fontSize: 'clamp(1.35rem, 4vw, 1.75rem)',
                fontWeight: 800,
                color: '#FFFFFF',
                marginBottom: '0.4rem',
                letterSpacing: '-0.02em',
              }}>
                Set New Password
              </h1>

              <p style={{
                fontSize: '0.9rem',
                color: '#AAAAAA',
                marginBottom: '1.75rem',
              }}>
                Please enter your new password below.
              </p>

              {/* Error banner */}
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

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {/* New Password */}
                <div suppressHydrationWarning style={{
                  background: 'rgba(22, 22, 22, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '4px',
                  padding: '0.5rem 0.9rem 0.4rem',
                }}>
                  <label htmlFor="new-password" style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#AAAAAA',
                    marginBottom: '0.15rem',
                  }}>
                    New Password (min. 8 characters)
                  </label>
                  {mounted ? (
                    <input
                      id="new-password"
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

                {/* Confirm New Password */}
                <div suppressHydrationWarning style={{
                  background: 'rgba(22, 22, 22, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '4px',
                  padding: '0.5rem 0.9rem 0.4rem',
                }}>
                  <label htmlFor="confirm-new-password" style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#AAAAAA',
                    marginBottom: '0.15rem',
                  }}>
                    Confirm New Password
                  </label>
                  {mounted ? (
                    <input
                      id="confirm-new-password"
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
                  id="reset-submit-btn"
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
                  {pending ? <Loader2 size={18} className="animate-spin" /> : 'Save New Password & Enter'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
