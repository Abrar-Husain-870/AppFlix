'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { signOut } from '@/app/actions/auth'
import {
  Flame, Search, PlusCircle, LogOut, User, Menu, X, Shield,
  FolderKanban, BarChart2, Settings, ChevronDown, Bookmark, UserRound,
} from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

import InstallPwaButton from '@/components/pwa/InstallPwaButton'

interface Profile {
  display_name: string | null
  username: string
  avatar_url: string | null
  role: string
}

export default function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()

    const loadProfile = async (u: SupabaseUser | null) => {
      setUser(u)
      if (u) {
        const { data } = await supabase
          .from('profiles')
          .select('display_name, username, avatar_url, role')
          .eq('id', u.id)
          .single()
        setProfile(data)
      } else {
        setProfile(null)
      }
    }

    supabase.auth.getUser().then(({ data }) => loadProfile(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => loadProfile(s?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setDropdownOpen(false) }, [pathname])

  const isAdmin = profile?.role === 'admin'
  const isActive = (href: string) => pathname.startsWith(href)

  // Hide Navbar completely on auth pages (login & signup)
  if (pathname === '/login' || pathname === '/signup') return null

  const navLinks = [
    { href: '/browse', label: 'Browse' },
    { href: '/bookmarks', label: 'Bookmarks' },
    { href: '/submit', label: 'Submit App' },
  ]

  const displayName = profile?.display_name || profile?.username || user?.email?.split('@')[0] || 'Account'

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
        <Link href="/?playIntro=true" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <img
            src="/assets/app-logos/AppFlix_logo_trimmed.png"
            alt="AppFlix"
            className="nav-logo-img"
            style={{
              height: '32px',
              maxHeight: '34px',
              width: 'auto',
              maxWidth: '140px',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </Link>

        {/* Desktop nav links */}
        <div className="desktop-only" style={{ alignItems: 'center', gap: '0.25rem' }}>
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} style={{
              padding: '0.4rem 0.9rem',
              color: isActive(link.href) ? '#FFFFFF' : '#AAAAAA',
              fontWeight: isActive(link.href) ? 600 : 400,
              textDecoration: 'none', fontSize: '0.9rem',
              borderRadius: '0.4rem',
              background: isActive(link.href) ? 'rgba(229,9,20,0.12)' : 'transparent',
              transition: 'color 0.2s, background 0.2s',
            }}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <InstallPwaButton />

          {/* Search */}
          <button
            id="nav-search-btn"
            onClick={() => router.push('/browse')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#AAAAAA', display: 'flex', alignItems: 'center', padding: '0.4rem' }}
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          {user ? (
            <>
              {/* Admin badge */}
              {isAdmin && (
                <Link href="/admin/queue" id="nav-admin-btn" title="Admin Queue"
                  style={{
                    alignItems: 'center', justifyContent: 'center',
                    width: '32px', height: '32px',
                    background: 'rgba(229,9,20,0.15)', border: '1px solid rgba(229,9,20,0.4)',
                    borderRadius: '50%', color: '#E50914', transition: 'all 0.2s',
                  }}
                  className="desktop-only"
                >
                  <Shield size={15} />
                </Link>
              )}

              {/* Avatar dropdown (Desktop) */}
              <div ref={dropdownRef} style={{ position: 'relative' }} className="desktop-only">
                <button
                  id="nav-avatar-btn"
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    background: dropdownOpen ? '#262626' : 'transparent',
                    border: `1px solid ${dropdownOpen ? '#3B3B3B' : 'transparent'}`,
                    borderRadius: '9999px', padding: '3px 10px 3px 3px',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {/* Avatar circle */}
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '50%',
                    background: '#262626', border: '1px solid #3B3B3B',
                    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <User size={16} style={{ color: '#AAAAAA' }} />}
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#FFFFFF', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayName}
                  </span>
                  <ChevronDown size={13} style={{ color: '#AAAAAA', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                </button>

                {/* Dropdown panel */}
                {dropdownOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    width: '220px',
                    background: '#1F1F1F', border: '1px solid #2B2B2B',
                    borderRadius: '0.75rem', boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                    overflow: 'hidden', zIndex: 100,
                    animation: 'dropdownIn 0.15s ease',
                  }}>
                    {/* User info header */}
                    <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid #2B2B2B' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {displayName}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.email}
                      </p>
                    </div>

                    {/* Menu items */}
                    <div style={{ padding: '0.35rem' }}>
                      {[
                        { href: '/bookmarks',             icon: <Bookmark size={14} />,      label: 'My Bookmarks' },
                        { href: '/account',               icon: <Settings size={14} />,      label: 'My Account' },
                        { href: '/dashboard/projects',    icon: <FolderKanban size={14} />,  label: 'My Apps' },
                        { href: '/dashboard/analytics',   icon: <BarChart2 size={14} />,     label: 'Analytics' },
                        { href: '/submit',                icon: <PlusCircle size={14} />,    label: 'Submit App' },
                        ...(isAdmin ? [{ href: '/admin/queue', icon: <Shield size={14} />, label: 'Admin Queue' }] : []),
                      ].map(item => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setDropdownOpen(false)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.6rem',
                            padding: '0.55rem 0.75rem', borderRadius: '0.4rem',
                            color: isActive(item.href) ? '#FFFFFF' : '#AAAAAA',
                            background: isActive(item.href) ? 'rgba(229,9,20,0.1)' : 'transparent',
                            fontWeight: isActive(item.href) ? 600 : 400,
                            fontSize: '0.875rem', textDecoration: 'none',
                            transition: 'background 0.15s, color 0.15s',
                          }}
                          onMouseEnter={e => {
                            if (!isActive(item.href)) {
                              e.currentTarget.style.background = '#262626'
                              e.currentTarget.style.color = '#FFFFFF'
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isActive(item.href)) {
                              e.currentTarget.style.background = 'transparent'
                              e.currentTarget.style.color = '#AAAAAA'
                            }
                          }}
                        >
                          <span style={{ color: 'inherit', display: 'flex' }}>{item.icon}</span>
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    {/* Sign out */}
                    <div style={{ borderTop: '1px solid #2B2B2B', padding: '0.35rem' }}>
                      <form action={signOut}>
                        <button
                          id="dropdown-signout-btn"
                          type="submit"
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem',
                            padding: '0.55rem 0.75rem', borderRadius: '0.4rem',
                            background: 'transparent', border: 'none',
                            color: '#E50914', fontSize: '0.875rem', fontWeight: 500,
                            cursor: 'pointer', transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,9,20,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <LogOut size={14} /> Sign Out
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="desktop-only" style={{ alignItems: 'center', gap: '0.5rem' }}>
              <Link href="/login" id="nav-login-btn" style={{
                color: '#AAAAAA', fontWeight: 500, fontSize: '0.9rem',
                textDecoration: 'none', padding: '0.45rem 0.75rem',
                transition: 'color 0.2s',
              }}>
                Sign in
              </Link>
              <Link href="/signup" id="nav-signup-btn" style={{
                padding: '0.45rem 1rem', background: '#E50914',
                color: '#FFFFFF', fontWeight: 600, fontSize: '0.875rem',
                borderRadius: '0.5rem', textDecoration: 'none',
                transition: 'background 0.2s',
              }}>
                Get started
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            id="nav-mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#AAAAAA', padding: '0.3rem' }}
            className="mobile-only"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{
          borderTop: '1px solid #2B2B2B',
          background: '#161616', padding: '0.85rem 1rem',
          display: 'flex', flexDirection: 'column', gap: '0.25rem',
          boxShadow: '0 12px 30px rgba(0,0,0,0.8)',
        }}>
          {/* User info header on mobile */}
          {user && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.65rem 0.75rem', marginBottom: '0.35rem',
              borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.85rem',
            }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%',
                background: '#262626', border: '1px solid #3B3B3B',
                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <User size={18} style={{ color: '#AAAAAA' }} />}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</p>
                <p style={{ fontSize: '0.75rem', color: '#888888', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
              </div>
            </div>
          )}

          {[
            { href: '/browse',                label: '🍿 Browse Apps' },
            { href: '/bookmarks',             label: '🔖 My Bookmarks' },
            ...(user ? [
              { href: '/submit',              label: '➕ Submit App' },
              { href: '/dashboard/projects',  label: '📁 My Apps' },
              { href: '/dashboard/analytics', label: '📊 Analytics' },
              { href: '/account',             label: '⚙️ My Account' },
            ] : [
              { href: '/login',   label: '🔑 Sign In' },
              { href: '/signup',  label: '🚀 Get Started' },
            ]),
            ...(isAdmin ? [{ href: '/admin/queue', label: '🛡️ Admin Queue' }] : []),
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                padding: '0.7rem 0.85rem',
                color: isActive(link.href) ? '#FFFFFF' : '#CCCCCC',
                fontWeight: isActive(link.href) ? 700 : 500,
                textDecoration: 'none', fontSize: '0.92rem',
                borderRadius: '0.5rem',
                background: isActive(link.href) ? 'rgba(229,9,20,0.18)' : 'rgba(255,255,255,0.03)',
                border: isActive(link.href) ? '1px solid rgba(229,9,20,0.4)' : '1px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span>{link.label}</span>
            </Link>
          ))}

          {user && (
            <form action={signOut} style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.65rem' }}>
              <button type="submit" style={{
                width: '100%', padding: '0.7rem 0.85rem', textAlign: 'left',
                background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.3)', cursor: 'pointer',
                color: '#EF4444', fontSize: '0.92rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                borderRadius: '0.5rem',
              }}>
                <LogOut size={16} /> Sign Out
              </button>
            </form>
          )}
        </div>
      )}

      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </nav>
  )
}
