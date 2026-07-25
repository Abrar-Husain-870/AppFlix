'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ProjectCard from '@/components/projects/ProjectCard'
import { Bookmark, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

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

export default function BookmarksPage() {
  const [user, setUser] = useState<User | null>(null)
  const [bookmarkedProjects, setBookmarkedProjects] = useState<Project[]>([])
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function loadBookmarks() {
      const { data: authData } = await supabase.auth.getUser()
      const currentUser = authData.user
      setUser(currentUser)

      if (!currentUser) {
        setLoading(false)
        return
      }

      // Fetch user's bookmarks with joined project details
      const { data: bookmarks } = await supabase
        .from('bookmarks')
        .select(`
          id,
          project_id,
          projects!inner (
            id, name, slug, tagline, icon_url, upvote_count, stage, platforms, status, deleted_at,
            categories(name, slug)
          )
        `)
        .eq('user_id', currentUser.id)

      const validProjects = (bookmarks ?? [])
        .map((b: any) => b.projects)
        .filter((p: any) => p && p.status === 'approved' && !p.deleted_at)

      setBookmarkedProjects(validProjects)

      if (validProjects.length > 0) {
        const ids = validProjects.map(p => p.id)
        const { data: upvotes } = await supabase
          .from('upvotes')
          .select('project_id')
          .eq('user_id', currentUser.id)
          .in('project_id', ids)

        setUpvotedIds(new Set((upvotes ?? []).map(u => u.project_id)))
      }

      setLoading(false)
    }

    loadBookmarks()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#141414', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>

        {/* Page Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          <div style={{ width: '4px', height: '32px', background: '#E50914', borderRadius: '2px' }} />
          <div style={{
            width: '42px', height: '42px', borderRadius: '10px',
            background: 'rgba(229, 9, 20, 0.15)', border: '1px solid rgba(229, 9, 20, 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E50914',
          }}>
            <Bookmark size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '-0.03em' }}>
              My Bookmarks
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#AAAAAA', margin: '0.2rem 0 0' }}>
              Your saved student projects for quick reference
            </p>
          </div>
          <span style={{
            marginLeft: 'auto',
            fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF',
            background: '#E50914', padding: '0.35rem 0.85rem', borderRadius: '9999px',
            boxShadow: '0 4px 14px rgba(229, 9, 20, 0.4)',
          }}>
            {bookmarkedProjects.length} Saved
          </span>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '210px', borderRadius: '0.85rem', background: '#1F1F1F' }} />
            ))}
          </div>
        ) : !user ? (
          <div style={{
            textAlign: 'center', padding: '4rem 1.5rem', background: '#1A1A1A',
            borderRadius: '0.85rem', border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <Bookmark size={48} style={{ color: '#E50914', marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.25rem', color: '#FFFFFF', fontWeight: 700, marginBottom: '0.5rem' }}>
              Sign in to view your bookmarks
            </h2>
            <p style={{ color: '#AAAAAA', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Save your favorite student apps to access them anytime.
            </p>
            <Link
              href="/login"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1.5rem', background: '#E50914', color: '#FFFFFF',
                fontWeight: 700, borderRadius: '0.5rem', textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(229, 9, 20, 0.4)',
              }}
            >
              Sign In <ArrowRight size={16} />
            </Link>
          </div>
        ) : bookmarkedProjects.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '4rem 1.5rem', background: '#1A1A1A',
            borderRadius: '0.85rem', border: '1px solid rgba(255, 255, 255, 0.08)',
          }}>
            <Bookmark size={48} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.25rem', color: '#FFFFFF', fontWeight: 700, marginBottom: '0.5rem' }}>
              No bookmarks saved yet
            </h2>
            <p style={{ color: '#AAAAAA', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
              Click the bookmark icon on any app page to save projects to your personal collection.
            </p>
            <Link
              href="/browse"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1.5rem', background: '#E50914', color: '#FFFFFF',
                fontWeight: 700, borderRadius: '0.5rem', textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(229, 9, 20, 0.4)',
              }}
            >
              Explore Projects <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {bookmarkedProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                isUpvoted={upvotedIds.has(project.id)}
                isAuthenticated={!!user}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
