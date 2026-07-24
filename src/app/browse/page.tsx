'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import ProjectCard from '@/components/projects/ProjectCard'
import { Search, SlidersHorizontal, TrendingUp, Clock, Flame } from 'lucide-react'
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
      {/* Page header */}
      <div style={{
        borderBottom: '1px solid #2B2B2B',
        background: 'linear-gradient(180deg, #1a0a0a 0%, #141414 100%)',
        padding: '2rem 1.5rem 1.5rem',
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.35rem', letterSpacing: '-0.03em' }}>
            Discover Projects
          </h1>
          <p style={{ color: '#AAAAAA', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Student-built apps, tools, and innovations from your university
          </p>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: '480px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
            <input
              id="browse-search"
              type="search"
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '0.7rem 0.9rem 0.7rem 2.6rem',
                background: '#1F1F1F', border: '1px solid #2B2B2B',
                borderRadius: '0.6rem', color: '#FFFFFF', fontSize: '0.9rem',
                outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#E50914'}
              onBlur={e => e.currentTarget.style.borderColor = '#2B2B2B'}
            />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Sidebar — category filter */}
        <aside style={{
          width: '200px', flexShrink: 0,
          position: 'sticky', top: '76px',
          display: 'none', // hidden on mobile
        }} className="hidden md:block">
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
            Categories
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            {/* All */}
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
          {/* Mobile category scroller */}
          <div style={{
            display: 'flex', gap: '0.5rem', overflowX: 'auto',
            paddingBottom: '0.5rem', marginBottom: '1rem',
            scrollbarWidth: 'none',
          }} className="md:hidden">
            {[{ id: 0, name: 'All', slug: 'all', icon: null }, ...categories].map(cat => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                style={{
                  flexShrink: 0, padding: '0.4rem 0.9rem',
                  background: selectedCategory === cat.slug ? '#E50914' : '#1F1F1F',
                  color: '#FFFFFF', border: `1px solid ${selectedCategory === cat.slug ? '#E50914' : '#2B2B2B'}`,
                  borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
                  transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Sort tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem' }}>
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                id={`sort-${opt.value}`}
                onClick={() => setSort(opt.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.4rem 0.9rem', fontSize: '0.85rem', fontWeight: sort === opt.value ? 600 : 400,
                  background: sort === opt.value ? 'rgba(229,9,20,0.12)' : 'transparent',
                  color: sort === opt.value ? '#FFFFFF' : '#AAAAAA',
                  border: `1px solid ${sort === opt.value ? 'rgba(229,9,20,0.3)' : 'transparent'}`,
                  borderRadius: '0.4rem', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
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
