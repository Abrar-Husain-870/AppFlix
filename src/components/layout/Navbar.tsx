'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { signOut } from '@/app/actions/auth'
import { Flame, Search, PlusCircle, LayoutDashboard, LogOut, User, Menu, X } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { href: '/browse', label: 'Browse' },
    { href: '/submit', label: 'Submit Project' },
  ]

  const isActive = (href: string) => pathname.startsWith(href)

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: scrolled ? 'rgba(20,20,20,0.95)' : '#141414',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: '1px solid #2B2B2B',
      transition: 'background 0.3s, backdrop-filter 0.3s',
    }}>
      <div style={{
        maxWidth: '1280px', margin: '0 auto',
        padding: '0 1.5rem', height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Flame size={22} style={{ color: '#E50914' }} />
          <span style={{
            fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.04em',
            background: 'linear-gradient(135deg, #E50914, #FF6B6B)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>AppFlix</span>
        </Link>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className="hidden md:flex">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: '0.4rem 0.9rem',
                color: isActive(link.href) ? '#FFFFFF' : '#AAAAAA',
                fontWeight: isActive(link.href) ? 600 : 400,
                textDecoration: 'none', fontSize: '0.9rem',
                borderRadius: '0.4rem',
                background: isActive(link.href) ? 'rgba(229,9,20,0.12)' : 'transparent',
                transition: 'color 0.2s, background 0.2s',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right: auth actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Search icon */}
          <button
            id="nav-search-btn"
            onClick={() => router.push('/browse')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#AAAAAA', display: 'flex', alignItems: 'center', padding: '0.4rem' }}
            aria-label="Search projects"
          >
            <Search size={18} />
          </button>

          {user ? (
            <>
              <Link
                href="/submit"
                id="nav-submit-btn"
                style={{
                  display: 'none', // hidden on mobile, visible md+
                  alignItems: 'center', gap: '0.4rem',
                  padding: '0.45rem 1rem', background: '#E50914',
                  color: '#FFFFFF', fontWeight: 600, fontSize: '0.85rem',
                  borderRadius: '0.5rem', textDecoration: 'none',
                  transition: 'background 0.2s',
                }}
                className="hidden md:flex"
              >
                <PlusCircle size={15} />
                Submit
              </Link>
              <Link
                href="/dashboard/projects"
                id="nav-dashboard-btn"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '34px', height: '34px',
                  background: '#262626', border: '1px solid #2B2B2B',
                  borderRadius: '50%', color: '#AAAAAA',
                  transition: 'border-color 0.2s, color 0.2s',
                }}
                title="Dashboard"
                aria-label="Dashboard"
              >
                <User size={16} />
              </Link>
              <form action={signOut}>
                <button
                  id="nav-signout-btn"
                  type="submit"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#AAAAAA', fontSize: '0.85rem', padding: '0.4rem',
                  }}
                  title="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                id="nav-login-btn"
                style={{
                  color: '#AAAAAA', fontWeight: 500, fontSize: '0.9rem',
                  textDecoration: 'none', padding: '0.45rem 0.75rem',
                  transition: 'color 0.2s',
                }}
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                id="nav-signup-btn"
                style={{
                  padding: '0.45rem 1rem', background: '#E50914',
                  color: '#FFFFFF', fontWeight: 600, fontSize: '0.875rem',
                  borderRadius: '0.5rem', textDecoration: 'none',
                  transition: 'background 0.2s',
                }}
              >
                Get started
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            id="nav-mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#AAAAAA', display: 'flex' }}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          borderTop: '1px solid #2B2B2B',
          background: '#1F1F1F', padding: '1rem 1.5rem',
          display: 'flex', flexDirection: 'column', gap: '0.25rem',
        }}>
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                padding: '0.65rem 0.75rem', color: isActive(link.href) ? '#FFFFFF' : '#AAAAAA',
                fontWeight: isActive(link.href) ? 600 : 400,
                textDecoration: 'none', fontSize: '0.95rem',
                borderRadius: '0.4rem',
                background: isActive(link.href) ? 'rgba(229,9,20,0.12)' : 'transparent',
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
