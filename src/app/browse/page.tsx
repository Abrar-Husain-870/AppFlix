'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import ProjectCard from '@/components/projects/ProjectCard'
import { TrendingUp, Clock, Flame, ChevronLeft, ChevronRight } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

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

type SortOption = 'top' | 'newest' | 'trending'

const SORT_OPTIONS: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: 'top',      label: 'Top',     icon: <TrendingUp size={14} /> },
  { value: 'newest',   label: 'Newest',  icon: <Clock size={14} /> },
  { value: 'trending', label: 'Hot',     icon: <Flame size={14} /> },
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
      const cat = categories.find(c => c.slug === selectedCategory)
      if (cat) query = query.eq('category_id', cat.id)
    }

    if (debouncedSearch.trim()) {
      query = query.ilike('name', `%${debouncedSearch}%`)
    }

    if (sort === 'top') {
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
            Browse, upvote, and submit university projects — all in one place.
          </p>

          {/* Hero search bar — Netflix style */}
          <p style={{
            fontSize: '0.875rem',
            color: '#DDDDDD',
            marginBottom: '0.85rem',
            fontWeight: 500,
          }}>
            Ready to explore? Search projects to discover student innovations.
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
              placeholder="Search projects or categories…"
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

        {/* Bottom fade into content */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px',
          background: 'linear-gradient(to bottom, transparent, #141414)',
          pointerEvents: 'none',
        }} />
      </section>

      {/* ── Filter + Browse Content ───────────────────────────── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Sidebar — category filter */}
        <aside style={{
          width: '200px', flexShrink: 0,
          position: 'sticky', top: '76px',
          display: 'none',
        }} className="hidden md:block">
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
            Categories
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <button
              id="cat-all"
              onClick={() => setSelectedCategory('all')}
              style={{
                textAlign: 'left', padding: '0.5rem 0.75rem',
                background: selectedCategory === 'all' ? 'rgba(229,9,20,0.12)' : 'transparent',
                color: selectedCategory === 'all' ? '#FFFFFF' : '#AAAAAA',
                fontWeight: selectedCategory === 'all' ? 600 : 400,
                border: 'none', borderRadius: '0.4rem', cursor: 'pointer',
                fontSize: '0.875rem', transition: 'all 0.15s', width: '100%',
              }}
            >
              All Projects
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                id={`cat-${cat.slug}`}
                onClick={() => setSelectedCategory(cat.slug)}
                style={{
                  textAlign: 'left', padding: '0.5rem 0.75rem',
                  background: selectedCategory === cat.slug ? 'rgba(229,9,20,0.12)' : 'transparent',
                  color: selectedCategory === cat.slug ? '#FFFFFF' : '#AAAAAA',
                  fontWeight: selectedCategory === cat.slug ? 600 : 400,
                  border: 'none', borderRadius: '0.4rem', cursor: 'pointer',
                  fontSize: '0.875rem', transition: 'all 0.15s', width: '100%',
                }}
              >
                {cat.icon && <span style={{ marginRight: '0.4rem' }}>{cat.icon}</span>}
                {cat.name}
              </button>
            ))}
          </div>
        </aside>


        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {/* Category scroller with arrows */}
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            {/* Left arrow */}
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
                border: 'none', cursor: 'pointer', color: '#AAAAAA',
                paddingLeft: '2px',
              }}
            >
              <ChevronLeft size={18} />
            </button>

            {/* Scrollable pill strip */}
            <div
              ref={catScrollRef}
              style={{
                display: 'flex', gap: '0.5rem', overflowX: 'auto',
                paddingBottom: '0.25rem', paddingLeft: '32px', paddingRight: '32px',
                scrollbarWidth: 'none',
              }}
            >
              {[{ id: 0, name: 'All', slug: 'all', icon: null }, ...categories].map(cat => (
                <button
                  key={cat.slug}
                  id={`cat-pill-${cat.slug}`}
                  onClick={() => setSelectedCategory(cat.slug)}
                  style={{
                    flexShrink: 0, padding: '0.4rem 0.9rem',
                    background: selectedCategory === cat.slug ? '#E50914' : '#1F1F1F',
                    color: '#FFFFFF', border: `1px solid ${selectedCategory === cat.slug ? '#E50914' : '#2B2B2B'}`,
                    borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                  }}
                >
                  {cat.icon && <span style={{ marginRight: '0.3rem' }}>{cat.icon}</span>}
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Right arrow */}
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
                border: 'none', cursor: 'pointer', color: '#AAAAAA',
                paddingRight: '2px',
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Sort tabs with arrows */}
          <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
            {/* Left arrow */}
            <button
              id="sort-scroll-left"
              type="button"
              onClick={() => scroll(sortScrollRef, 'left')}
              aria-label="Scroll sort left"
              style={{
                position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                zIndex: 10, width: '28px', height: '28px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(to right, #141414 60%, transparent)',
                border: 'none', cursor: 'pointer', color: '#666',
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <div
              ref={sortScrollRef}
              style={{
                display: 'flex', gap: '0.25rem', overflowX: 'auto',
                paddingLeft: '28px', paddingRight: '28px',
                scrollbarWidth: 'none',
              }}
            >
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  id={`sort-${opt.value}`}
                  onClick={() => setSort(opt.value)}
                  style={{
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.4rem 0.9rem', fontSize: '0.85rem', fontWeight: sort === opt.value ? 600 : 400,
                    background: sort === opt.value ? 'rgba(229,9,20,0.12)' : 'transparent',
                    color: sort === opt.value ? '#FFFFFF' : '#AAAAAA',
                    border: `1px solid ${sort === opt.value ? 'rgba(229,9,20,0.3)' : 'transparent'}`,
                    borderRadius: '0.4rem', cursor: 'pointer', transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Right arrow */}
            <button
              id="sort-scroll-right"
              type="button"
              onClick={() => scroll(sortScrollRef, 'right')}
              aria-label="Scroll sort right"
              style={{
                position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
                zIndex: 10, width: '28px', height: '28px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(to left, #141414 60%, transparent)',
                border: 'none', cursor: 'pointer', color: '#666',
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: '180px', borderRadius: '0.75rem' }} />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</p>
              <h3 style={{ color: '#FFFFFF', fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                No projects found
              </h3>
              <p style={{ color: '#AAAAAA', fontSize: '0.875rem' }}>
                {debouncedSearch ? `No results for "${debouncedSearch}"` : 'No approved projects in this category yet.'}
              </p>
            </div>
          ) : (
            <>
              <p style={{ color: '#555', fontSize: '0.8rem', marginBottom: '1rem' }}>
                {projects.length} project{projects.length !== 1 ? 's' : ''}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                {projects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isUpvoted={upvotedIds.has(project.id)}
                    isAuthenticated={!!user}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
