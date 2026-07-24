'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signIn } from '@/app/actions/auth'
import { Loader2, Mail, Lock, Zap } from 'lucide-react'

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'radial-gradient(ellipse at top, #1a0a0a 0%, #141414 60%)' }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: '-20%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(229,9,20,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{
              fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em',
              background: 'linear-gradient(135deg, #E50914, #FF6B6B)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>AppFlix</span>
          </Link>
          <p style={{ color: '#AAAAAA', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Student Project Showcase
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#1F1F1F',
          border: '1px solid #2B2B2B',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.25rem' }}>
            Welcome back
          </h1>
          <p style={{ color: '#AAAAAA', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
            Sign in to your AppFlix account
          </p>

          {/* Error banner */}
          {state?.error && (
            <div style={{
              background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.3)',
              borderRadius: '0.5rem', padding: '0.75rem 1rem',
              color: '#FF6B6B', fontSize: '0.875rem', marginBottom: '1.25rem',
            }}>
              {state.error}
            </div>
          )}

          {/* Success banner */}
          {state?.message && (
            <div style={{
              background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.3)',
              borderRadius: '0.5rem', padding: '0.75rem 1rem',
              color: '#2ECC71', fontSize: '0.875rem', marginBottom: '1.25rem',
            }}>
              {state.message}
            </div>
          )}

          <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Email */}
            <div>
              <label htmlFor="email" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#AAAAAA', marginBottom: '0.4rem' }}>
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@university.edu"
                  autoComplete="email"
                  required
                  style={{
                    width: '100%', padding: '0.7rem 0.85rem 0.7rem 2.5rem',
                    background: '#262626', border: '1px solid #2B2B2B',
                    borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.9rem',
                    outline: 'none', transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                  onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label htmlFor="password" style={{ fontSize: '0.8rem', fontWeight: 500, color: '#AAAAAA' }}>
                  Password
                </label>
                <Link href="/forgot-password" style={{ fontSize: '0.75rem', color: '#E50914', textDecoration: 'none' }}>
                  Forgot?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  style={{
                    width: '100%', padding: '0.7rem 0.85rem 0.7rem 2.5rem',
                    background: '#262626', border: '1px solid #2B2B2B',
                    borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.9rem',
                    outline: 'none', transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
                  onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={pending}
              style={{
                width: '100%', padding: '0.8rem',
                background: pending ? '#8B0000' : '#E50914',
                color: '#FFFFFF', fontWeight: 700, fontSize: '0.95rem',
                border: 'none', borderRadius: '0.5rem', cursor: pending ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s, transform 0.1s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                marginTop: '0.25rem',
              }}
              onMouseEnter={e => { if (!pending) e.currentTarget.style.background = '#F40612' }}
              onMouseLeave={e => { if (!pending) e.currentTarget.style.background = '#E50914' }}
            >
              {pending ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              {pending ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#2B2B2B' }} />
            <span style={{ color: '#555', fontSize: '0.75rem' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: '#2B2B2B' }} />
          </div>

          {/* Sign up link */}
          <p style={{ textAlign: 'center', color: '#AAAAAA', fontSize: '0.875rem' }}>
            New to AppFlix?{' '}
            <Link href="/signup" style={{ color: '#E50914', fontWeight: 600, textDecoration: 'none' }}>
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
