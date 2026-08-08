'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, CheckCircle2 } from 'lucide-react'
import ContactUsModal from '@/components/ui/ContactUsModal'

export default function NetflixFooterCTA({
  isAuthenticated = false,
  hideCta = false,
}: {
  isAuthenticated?: boolean
  hideCta?: boolean
}) {
  const [email, setEmail] = useState('')
  const [ctaSent, setCtaSent] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)

  const router = useRouter()
  const shouldHideCta = hideCta

  const handleCtaSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setShowContactModal(true)
    } else {
      setShowContactModal(true)
    }
  }

  return (
    <>
      <footer style={{
        background: '#000000',
        color: '#737373',
        padding: shouldHideCta ? '3.5rem 1.5rem 2.5rem' : '4.5rem 1.5rem 3rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
        zIndex: 10,
        fontSize: '0.85rem',
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
        }}>
          {/* ── Top Contact Us Email CTA Block (Netflix-styled, non-monetary) ── */}
          {!shouldHideCta && (
            <div style={{
              textAlign: 'center',
              maxWidth: '820px',
              margin: '0 auto 4rem',
            }}>
              <h3 style={{
                fontSize: 'clamp(1.15rem, 2.5vw, 1.35rem)',
                fontWeight: 400,
                color: '#FFFFFF',
                marginBottom: '1.25rem',
                lineHeight: 1.35,
              }}>
                Have questions, feedback, or need help? Contact the AppFlix team.
              </h3>

              {ctaSent ? (
                <div style={{
                  padding: '1.1rem 1.5rem',
                  background: 'rgba(46, 204, 113, 0.12)',
                  border: '1px solid rgba(46, 204, 113, 0.3)',
                  borderRadius: '6px',
                  color: '#2ECC71',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.25rem',
                }}>
                  <CheckCircle2 size={18} />
                  <span>Message sent! Our support team will respond to your email shortly.</span>
                </div>
              ) : (
                /* Netflix-styled Form Layout */
                <form onSubmit={handleCtaSubmit} style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem',
                  maxWidth: '660px',
                  margin: '0 auto 1.25rem',
                  flexWrap: 'wrap',
                }}>
                  <div style={{ flex: '1 1 320px', minWidth: '260px' }}>
                    <input
                      id="footer-email-input"
                      type="email"
                      required
                      placeholder="Your email address"
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
                    id="footer-contact-team-btn"
                    type="submit"
                    style={{
                      height: '56px',
                      padding: '0 1.75rem',
                      background: '#E50914',
                      color: '#FFFFFF',
                      fontSize: '1.35rem',
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
                    Contact Us ›
                  </button>
                </form>
              )}

              {/* Trust Disclaimer */}
              <p style={{
                fontSize: '0.78rem',
                color: '#737373',
                lineHeight: 1.55,
                maxWidth: '780px',
                margin: '0 auto',
                textAlign: 'center',
              }}>
                Our campus developer support team responds to all student inquiries within 24 hours. No automated bots. Your privacy is strictly protected across our university platform.
              </p>
            </div>
          )}

          {/* ── Contact Line ("Questions? Email us at husainabrar870@gmail.com") ───────── */}
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '1rem', color: '#737373', margin: 0 }}>
              Questions? Email us at{' '}
              <a
                href="mailto:husainabrar870@gmail.com"
                style={{
                  color: '#FFFFFF',
                  textDecoration: 'underline',
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                husainabrar870@gmail.com
              </a>
            </p>
          </div>

          {/* ── Official 4-Column Footer Link Matrix ────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1.25rem 2rem',
            marginBottom: '2.5rem',
          }}>
            {/* Column 1 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <span onClick={() => setShowContactModal(true)} style={{ color: '#737373', textDecoration: 'underline', cursor: 'pointer' }}>FAQ</span>
              <span onClick={() => setShowContactModal(true)} style={{ color: '#737373', textDecoration: 'underline', cursor: 'pointer' }}>Investor Relations</span>
              <span onClick={() => setShowContactModal(true)} style={{ color: '#737373', textDecoration: 'underline', cursor: 'pointer' }}>Privacy</span>
              <span onClick={() => setShowContactModal(true)} style={{ color: '#737373', textDecoration: 'underline', cursor: 'pointer' }}>Speed Test</span>
            </div>

            {/* Column 2 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <span onClick={() => setShowContactModal(true)} style={{ color: '#737373', textDecoration: 'underline', cursor: 'pointer' }}>Help Centre</span>
              <span onClick={() => setShowContactModal(true)} style={{ color: '#737373', textDecoration: 'underline', cursor: 'pointer' }}>Jobs</span>
              <span onClick={() => setShowContactModal(true)} style={{ color: '#737373', textDecoration: 'underline', cursor: 'pointer' }}>Cookie Preferences</span>
              <span onClick={() => setShowContactModal(true)} style={{ color: '#737373', textDecoration: 'underline', cursor: 'pointer' }}>Legal Notices</span>
            </div>

            {/* Column 3 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <span onClick={() => router.push('/account')} style={{ color: '#737373', textDecoration: 'underline', cursor: 'pointer' }}>Account</span>
              <span onClick={() => setShowContactModal(true)} style={{ color: '#737373', textDecoration: 'underline', cursor: 'pointer' }}>Ways to Watch</span>
              <span onClick={() => setShowContactModal(true)} style={{ color: '#737373', textDecoration: 'underline', cursor: 'pointer' }}>Corporate Information</span>
              <span onClick={() => router.push('/browse')} style={{ color: '#737373', textDecoration: 'underline', cursor: 'pointer' }}>Only on AppFlix</span>
            </div>

            {/* Column 4 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <span onClick={() => setShowContactModal(true)} style={{ color: '#737373', textDecoration: 'underline', cursor: 'pointer' }}>Media Centre</span>
              <span onClick={() => setShowContactModal(true)} style={{ color: '#737373', textDecoration: 'underline', cursor: 'pointer' }}>Terms of Use</span>
              <span onClick={() => setShowContactModal(true)} style={{ color: '#737373', textDecoration: 'underline', cursor: 'pointer' }}>Contact Us</span>
              <span onClick={() => setShowContactModal(true)} style={{ color: '#737373', textDecoration: 'underline', cursor: 'pointer' }}>AppFlix Safety</span>
            </div>
          </div>

          {/* ── Language Selector Button ──────────────────────────────────── */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1.1rem',
              background: '#000000',
              border: '1px solid #333333',
              borderRadius: '4px',
              color: '#CCCCCC',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
              userSelect: 'none',
            }}>
              <Globe size={15} style={{ color: '#AAAAAA' }} />
              English ▾
            </div>
          </div>

          {/* ── Subtitle & Security Notice ───────────────────────────────── */}
          <div>
            <p style={{ fontSize: '0.9rem', color: '#737373', margin: '0 0 1rem 0' }}>
              AppFlix India / Campus Ecosystem
            </p>
            <p style={{ fontSize: '0.75rem', color: '#555555', margin: 0, lineHeight: 1.5 }}>
              This page is protected by Google reCAPTCHA to ensure you're not a bot.
            </p>
          </div>
        </div>
      </footer>

      {/* ── Shared Contact Support Modal ──────────────────────────── */}
      <ContactUsModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        initialEmail={email}
      />
    </>
  )
}
