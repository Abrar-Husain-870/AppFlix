'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import ProjectCard from '@/components/projects/ProjectCard'
import { TrendingUp, Clock, Flame, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import NetflixHorizonDivider from '@/components/ui/NetflixHorizonDivider'
import NetflixTrendingRow from '@/components/projects/NetflixTrendingRow'

interface Category {
  id: number
  name: string
  slug: string
  icon: string | null
}

interface Project {
  id: string
  name: string
  slug: string
  tagline: string
  icon_url: string | null
  upvote_count: number
  stage: string
  platforms: string[]
  categories: { name: string; slug: string } | null
}

type SortOption = 'top' | 'newest' | 'trending' | 'bookmarked'

const PLATFORM_FILTERS = [
  { id: 'p-web',     name: 'Web',               slug: 'web',               icon: '🌐' },
  { id: 'p-ios',     name: 'iOS',               slug: 'ios',               icon: '📱' },
  { id: 'p-android', name: 'Android',           slug: 'android',           icon: '🤖' },
  { id: 'p-win',     name: 'Windows',           slug: 'windows',           icon: '💻' },
  { id: 'p-mac',     name: 'macOS',             slug: 'macos',             icon: '🖥️' },
  { id: 'p-linux',   name: 'Linux',             slug: 'linux',             icon: '🐧' },
  { id: 'p-ext',     name: 'Browser Extension', slug: 'browser_extension', icon: '🧩' },
]

const SORT_OPTIONS: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: 'top',        label: 'Top',        icon: <TrendingUp size={14} /> },
  { value: 'newest',     label: 'Newest',     icon: <Clock size={14} /> },
  { value: 'trending',   label: 'Hot',        icon: <Flame size={14} /> },
  { value: 'bookmarked', label: 'Bookmarked', icon: <Bookmark size={14} /> },
]

export default function BrowsePage() {
  const [user, setUser] = useState<User | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sort, setSort] = useState<SortOption>('top')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const catScrollRef  = useRef<HTMLDivElement>(null)
  const sortScrollRef = useRef<HTMLDivElement>(null)

  function scroll(ref: React.RefObject<HTMLDivElement | null>, dir: 'left' | 'right') {
    ref.current?.scrollBy({ left: dir === 'left' ? -240 : 240, behavior: 'smooth' })
  }

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  // Auth state
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  // Fetch categories once
  useEffect(() => {
    createClient()
      .from('categories')
      .select('id, name, slug, icon')
      .order('name')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('projects')
      .select('id, name, slug, tagline, icon_url, upvote_count, stage, platforms, categories(name, slug)')
      .eq('status', 'approved')
      .is('deleted_at', null)

    if (selectedCategory !== 'all') {
      const isPlatform = PLATFORM_FILTERS.some(p => p.slug === selectedCategory)
      if (isPlatform) {
        query = query.contains('platforms', [selectedCategory])
      } else {
        const cat = categories.find(c => c.slug === selectedCategory)
        if (cat) query = query.eq('category_id', cat.id)
      }
    }

    if (debouncedSearch.trim()) {
      query = query.ilike('name', `%${debouncedSearch}%`)
    }

    if (sort === 'bookmarked') {
      if (user) {
        const { data: userBookmarks } = await supabase
          .from('bookmarks')
          .select('project_id')
          .eq('user_id', user.id)

        const bookmarkedIds = (userBookmarks ?? []).map(b => b.project_id)
        if (bookmarkedIds.length > 0) {
          query = query.in('id', bookmarkedIds)
        } else {
          setProjects([])
          setLoading(false)
          return
        }
      } else {
        setProjects([])
        setLoading(false)
        return
      }
    } else if (sort === 'top') {
      query = query.order('upvote_count', { ascending: false })
    } else if (sort === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else {
      // trending: most upvotes in last 7 days — approximate with view_count as proxy
      query = query.order('view_count', { ascending: false })
    }

    const { data } = await query.limit(50)
    setProjects((data as unknown as Project[]) ?? [])

    // Fetch user's upvotes
    if (user && data && data.length > 0) {
      const ids = data.map(p => p.id)
      const { data: upvotes } = await supabase
        .from('upvotes')
        .select('project_id')
        .eq('user_id', user.id)
        .in('project_id', ids)
      setUpvotedIds(new Set((upvotes ?? []).map(u => u.project_id)))
    } else {
      setUpvotedIds(new Set())
    }

    setLoading(false)
  }, [selectedCategory, sort, debouncedSearch, user, categories])

  useEffect(() => {
    if (categories.length > 0 || selectedCategory === 'all') {
      fetchProjects()
    }
  }, [fetchProjects, categories])

  return (
    <div style={{ minHeight: '100vh', background: '#141414' }}>

      {/* ── Netflix-style Hero ────────────────────────────────── */}
      <section style={{
        position: 'relative',
        height: '100vh',
        minHeight: '580px',
        maxHeight: '860px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* 3D Poster Wall Background from bg-standalone.html */}
        <iframe
          src="/bg-standalone.html"
          title="AppFlix 3D Wall Background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />

        {/* Multi-layer dark overlay — Netflix style */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(20,20,20,0.15) 0%, rgba(20,20,20,0.35) 50%, rgba(20,20,20,0.92) 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }} />
        {/* Red radial glow from center */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 40%, rgba(229,9,20,0.22) 0%, transparent 65%)',
          pointerEvents: 'none',
          zIndex: 1,
        }} />

        {/* Hero content */}
        <div style={{
          position: 'relative', zIndex: 2,
          textAlign: 'center',
          padding: '0 1.5rem',
          maxWidth: '720px',
          width: '100%',
        }}>
          <p style={{
            fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.18em',
            color: '#E50914', textTransform: 'uppercase', marginBottom: '1.25rem',
          }}>
            🔥 The Product Hunt for Your University
          </p>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 7vw, 5rem)',
            fontWeight: 900,
            letterSpacing: '-0.04em',
            lineHeight: 1.0,
            color: '#FFFFFF',
            marginBottom: '1.1rem',
            textShadow: '0 4px 32px rgba(0,0,0,0.8)',
          }}>
            Discover Student<br />
            <span style={{
              background: 'linear-gradient(135deg, #E50914 0%, #FF6B6B 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Built Apps
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(0.95rem, 2.5vw, 1.15rem)',
            color: 'rgba(255,255,255,0.7)',
            marginBottom: '2.25rem',
            lineHeight: 1.6,
            maxWidth: '480px',
            margin: '0 auto 2.25rem',
          }}>
            Browse, upvote, and submit university apps — all in one place.
          </p>

          {/* Hero search bar — Netflix style */}
          <p style={{
            fontSize: '0.875rem',
            color: '#DDDDDD',
            marginBottom: '0.85rem',
            fontWeight: 500,
          }}>
            Ready to explore? Search apps to discover student innovations.
          </p>

          <form onSubmit={e => e.preventDefault()} style={{
            display: 'flex',
            maxWidth: '560px',
            margin: '0 auto',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7)',
          }}>
            <input
              id="hero-search"
              type="search"
              placeholder="Search apps or categories…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1,
                padding: '1rem 1.2rem',
                background: 'rgba(15, 15, 15, 0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRight: 'none',
                borderRadius: '4px 0 0 4px',
                color: '#FFFFFF',
                fontSize: '1rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '1rem 1.75rem',
                background: '#E50914',
                border: 'none',
                borderRadius: '0 4px 4px 0',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '1.15rem',
                cursor: 'pointer',
                transition: 'background 0.2s',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F40612'}
              onMouseLeave={e => e.currentTarget.style.background = '#E50914'}
            >
              Get Started ›
            </button>
          </form>

          <p style={{
            color: '#888888',
            fontSize: '0.8rem',
            marginTop: '0.75rem',
          }}>
            Free for all university builders & creators.
          </p>
        </div>

      </section>

      {/* ── Filter + Browse Content Section (Overlaying Hero) ────── */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* Netflix Horizon Arc Divider Overlay */}
        <NetflixHorizonDivider fillColor="#141414" />

        <div style={{ background: '#141414', minHeight: '60vh' }}>
          {/* Netflix Trending Top 10 Row */}
          <NetflixTrendingRow projects={projects} title="Trending Now" />

          <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '0 2rem 3rem', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
            {/* Sidebar — category filter */}
            <aside style={{
              width: '210px', flexShrink: 0,
              position: 'sticky', top: '90px',
              display: 'none',
              background: '#1A1A1A',
              padding: '1.25rem',
              borderRadius: '0.85rem',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }} className="hidden md:block">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: '3px', height: '14px', background: '#E50914', borderRadius: '2px' }} />
                <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                  Categories
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {[{ id: 'all-0', name: 'All Projects', slug: 'all', icon: null }, ...PLATFORM_FILTERS, ...categories].map(cat => (
                  <button
                    key={cat.slug}
                    id={`cat-${cat.slug}`}
                    onClick={() => setSelectedCategory(cat.slug)}
                    style={{
                      textAlign: 'left', padding: '0.6rem 0.85rem',
                      background: selectedCategory === cat.slug ? '#E50914' : 'transparent',
                      color: selectedCategory === cat.slug ? '#FFFFFF' : '#AAAAAA',
                      fontWeight: selectedCategory === cat.slug ? 700 : 400,
                      border: 'none', borderRadius: '0.45rem', cursor: 'pointer',
                      fontSize: '0.875rem', transition: 'all 0.15s', width: '100%',
                      boxShadow: selectedCategory === cat.slug ? '0 4px 14px rgba(229, 9, 20, 0.4)' : 'none',
                    }}
                  >
                    {cat.icon && <span style={{ marginRight: '0.45rem' }}>{cat.icon}</span>}
                    {cat.name}
                  </button>
                ))}
              </div>
            </aside>

            {/* Main content */}
            <main style={{ flex: 1, minWidth: 0 }}>
              {/* Category scroller with arrows */}
              <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                <button
                  id="cat-scroll-left"
                  type="button"
                  onClick={() => scroll(catScrollRef, 'left')}
                  aria-label="Scroll categories left"
                  style={{
                    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                    zIndex: 10, width: '32px', height: '32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(to right, #141414 60%, transparent)',
                    border: 'none', cursor: 'pointer', color: '#FFFFFF',
                  }}
                >
                  <ChevronLeft size={20} />
                </button>

                {/* Scrollable pill strip */}
                <div
                  ref={catScrollRef}
                  style={{
                    display: 'flex', gap: '0.6rem', overflowX: 'auto',
                    paddingBottom: '0.4rem', paddingLeft: '32px', paddingRight: '32px',
                    scrollbarWidth: 'none',
                  }}
                >
                  {[{ id: 'all-0', name: 'All', slug: 'all', icon: null }, ...PLATFORM_FILTERS, ...categories].map(cat => (
                    <button
                      key={cat.slug}
                      id={`cat-pill-${cat.slug}`}
                      onClick={() => setSelectedCategory(cat.slug)}
                      style={{
                        flexShrink: 0, padding: '0.5rem 1.1rem',
                        background: selectedCategory === cat.slug ? '#E50914' : '#1A1A1A',
                        color: '#FFFFFF',
                        border: `1px solid ${selectedCategory === cat.slug ? '#E50914' : 'rgba(255,255,255,0.1)'}`,
                        boxShadow: selectedCategory === cat.slug ? '0 4px 14px rgba(229, 9, 20, 0.45)' : 'none',
                        borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                      }}
                    >
                      {cat.icon && <span style={{ marginRight: '0.35rem' }}>{cat.icon}</span>}
                      {cat.name}
                    </button>
                  ))}
                </div>

                <button
                  id="cat-scroll-right"
                  type="button"
                  onClick={() => scroll(catScrollRef, 'right')}
                  aria-label="Scroll categories right"
                  style={{
                    position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
                    zIndex: 10, width: '32px', height: '32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(to left, #141414 60%, transparent)',
                    border: 'none', cursor: 'pointer', color: '#FFFFFF',
                  }}
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Header + Sort controls bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '1rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                {/* Netflix-style Title Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '4px', height: '24px', background: '#E50914', borderRadius: '2px' }} />
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', margin: 0 }}>
                    {selectedCategory === 'all'
                      ? 'Explore All Apps'
                      : categories.find(c => c.slug === selectedCategory)?.name || 'Apps'}
                  </h2>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#E50914',
                    background: 'rgba(229, 9, 20, 0.15)',
                    padding: '0.15rem 0.55rem',
                    borderRadius: '9999px',
                    border: '1px solid rgba(229, 9, 20, 0.3)',
                  }}>
                    {projects.length}
                  </span>
                </div>

                {/* Sort tabs */}
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      id={`sort-${opt.value}`}
                      onClick={() => setSort(opt.value)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.45rem 0.95rem', fontSize: '0.85rem',
                        fontWeight: sort === opt.value ? 700 : 500,
                        background: sort === opt.value ? 'rgba(229, 9, 20, 0.2)' : '#1A1A1A',
                        color: sort === opt.value ? '#FFFFFF' : '#AAAAAA',
                        border: `1px solid ${sort === opt.value ? '#E50914' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '0.45rem', cursor: 'pointer', transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                        boxShadow: sort === opt.value ? '0 4px 12px rgba(229, 9, 20, 0.25)' : 'none',
                      }}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid */}
              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: '210px', borderRadius: '0.85rem', background: '#1F1F1F' }} />
                  ))}
                </div>
              ) : projects.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '4rem 1rem',
                  background: '#1A1A1A',
                  borderRadius: '0.85rem',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</p>
                  <h3 style={{ color: '#FFFFFF', fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    No apps found
                  </h3>
                  <p style={{ color: '#AAAAAA', fontSize: '0.875rem' }}>
                    {debouncedSearch ? `No results found for "${debouncedSearch}"` : 'No approved apps in this category yet.'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {projects.map(project => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      isUpvoted={upvotedIds.has(project.id)}
                      isAuthenticated={!!user}
                    />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}
