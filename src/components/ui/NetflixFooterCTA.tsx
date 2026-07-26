'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'

export default function NetflixFooterCTA({ isAuthenticated = false, hideCta = false }: { isAuthenticated?: boolean; hideCta?: boolean }) {
  const [email, setEmail] = useState('')
  const router = useRouter()

  const shouldHideCta = isAuthenticated || hideCta

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      router.push(`/signup?email=${encodeURIComponent(email)}`)
    } else {
      router.push('/signup')
    }
  }

  return (
    <footer style={{
      background: '#000000',
      color: '#B3B3B3',
      padding: shouldHideCta ? '3rem 1.5rem 2.5rem' : '4rem 1.5rem 3rem',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'relative',
      zIndex: 10,
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
      }}>
        {/* ── Top Email Get-Started CTA Block (Only for unauthenticated users) ── */}
        {!shouldHideCta && (
          <div style={{
            textAlign: 'center',
            maxWidth: '820px',
            margin: '0 auto 4rem',
          }}>
            <h3 style={{
              fontSize: 'clamp(1.2rem, 3vw, 1.4rem)',
              fontWeight: 500,
              color: '#FFFFFF',
              marginBottom: '1.25rem',
              lineHeight: 1.35,
            }}>
              Ready to showcase your app? Enter your email to get started.
            </h3>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              maxWidth: '660px',
              margin: '0 auto 1.5rem',
              flexWrap: 'wrap',
            }}>
              <div style={{ flex: '1 1 320px', minWidth: '280px' }}>
                <input
                  id="footer-email-input"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    height: '56px',
                    padding: '0 1.25rem',
                    background: 'rgba(229, 229, 229, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '4px',
                    color: '#FFFFFF',
                    fontSize: '1rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#FFFFFF'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'}
                />
              </div>

              <button
                id="footer-get-started-btn"
                type="submit"
                style={{
                  height: '56px',
                  padding: '0 1.75rem',
                  background: '#E50914',
                  color: '#FFFFFF',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.2s',
                  boxShadow: '0 4px 16px rgba(229, 9, 20, 0.35)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F40612'}
                onMouseLeave={e => e.currentTarget.style.background = '#E50914'}
              >
                Get Started ›
              </button>
            </form>

            {/* Legal / Disclaimer Notice matching Netflix fine print */}
            <p style={{
              fontSize: '0.8rem',
              color: '#737373',
              lineHeight: 1.6,
              maxWidth: '780px',
              margin: '0 auto',
              textAlign: 'center',
            }}>
              AppFlix is completely free for all university students. No paid subscription required. All submitted projects undergo campus administrative review to ensure safety, quality, and relevance across our university ecosystem.
            </p>
          </div>
        )}

        {/* ── Unclickable Black Area Links (Exact image replication) ───────── */}
        <div style={{
          paddingTop: shouldHideCta ? '0' : '2.5rem',
          borderTop: shouldHideCta ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          {/* Top Sentence */}
          <p style={{
            fontSize: '0.92rem',
            color: '#AAAAAA',
            marginBottom: '2.25rem',
            userSelect: 'none',
          }}>
            AppFlix is an open showcase platform for university student projects, apps, and digital innovations.
          </p>

          {/* 3 Columns Unclickable Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2rem',
            marginBottom: '2.5rem',
          }}>
            {/* Column 1: PLATFORM */}
            <div>
              <p style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#DDDDDD',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '1rem',
                margin: '0 0 1rem 0',
                userSelect: 'none',
              }}>
                PLATFORM
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#757575', cursor: 'default', userSelect: 'none' }}>
                  Student Built &amp; Owned
                </span>
                <span style={{ fontSize: '0.875rem', color: '#757575', cursor: 'default', userSelect: 'none' }}>
                  Free Showcase Platform
                </span>
                <span style={{ fontSize: '0.875rem', color: '#757575', cursor: 'default', userSelect: 'none' }}>
                  Peer Project Discovery
                </span>
              </div>
            </div>

            {/* Column 2: COMMUNITY */}
            <div>
              <p style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#DDDDDD',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '1rem',
                margin: '0 0 1rem 0',
                userSelect: 'none',
              }}>
                COMMUNITY
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#757575', cursor: 'default', userSelect: 'none' }}>
                  University Innovation
                </span>
                <span style={{ fontSize: '0.875rem', color: '#757575', cursor: 'default', userSelect: 'none' }}>
                  Real-time Upvotes
                </span>
                <span style={{ fontSize: '0.875rem', color: '#757575', cursor: 'default', userSelect: 'none' }}>
                  Developer Dashboards
                </span>
              </div>
            </div>

            {/* Column 3: QUALITY & SAFETY */}
            <div>
              <p style={{
                fontSize: '0.82rem',
                fontWeight: 800,
                color: '#DDDDDD',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '1rem',
                margin: '0 0 1rem 0',
                userSelect: 'none',
              }}>
                QUALITY &amp; SAFETY
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#757575', cursor: 'default', userSelect: 'none' }}>
                  Moderated App Queue
                </span>
                <span style={{ fontSize: '0.875rem', color: '#757575', cursor: 'default', userSelect: 'none' }}>
                  Verified Submissions
                </span>
                <span style={{ fontSize: '0.875rem', color: '#757575', cursor: 'default', userSelect: 'none' }}>
                  Safe Student Environment
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Bar Divider + Copyright & Language Selector */}
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '1.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            <p style={{
              fontSize: '0.825rem',
              color: '#555555',
              margin: 0,
              userSelect: 'none',
            }}>
              © {new Date().getFullYear()} AppFlix • Built for student builders and innovators
            </p>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.45rem 1rem',
              background: '#141414',
              border: '1px solid #333333',
              borderRadius: '4px',
              color: '#CCCCCC',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'default',
              userSelect: 'none',
            }}>
              <Globe size={14} style={{ color: '#AAAAAA' }} />
              English
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
