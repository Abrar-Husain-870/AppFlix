'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { applyPublicVisibilityFilter } from '@/lib/supabase/public-queries'
import { ProfileCard } from '@/components/ui/card-5'

import {
  Users, Search, Flame, ThumbsUp, Eye, ShieldCheck, MapPin,
  Award, Trophy, Sparkles, Crown, Medal
} from 'lucide-react'

interface Developer {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  location: string | null
  created_at: string
  github_url?: string | null
  website_url?: string | null
  published_apps_count: number
  total_upvotes: number
  total_views: number
  rank: number
  credibilityBadge: {
    label: string
    icon: React.ReactNode
  }
}

type DevSortOption = 'upvotes' | 'apps' | 'views'

export default function DiscoverDevelopersSection() {
  const router = useRouter()
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<DevSortOption>('upvotes')

  useEffect(() => {
    async function loadDevelopers() {
      try {
        setLoading(true)
        const supabase = createClient()

        // 1. Fetch all approved non-deleted projects first
        const baseQuery = supabase.from('projects').select('id, user_id, upvote_count, view_count')
        const { data: projectsData, error: projErr } = await applyPublicVisibilityFilter(baseQuery)

        if (projErr || !projectsData || projectsData.length === 0) {
          setDevelopers([])
          setLoading(false)
          return
        }

        // Group projects by user_id
        const userProjectsMap = new Map<string, any[]>()
        for (const p of projectsData) {
          if (!p.user_id) continue
          const list = userProjectsMap.get(p.user_id) || []
          list.push(p)
          userProjectsMap.set(p.user_id, list)
        }

        const devUserIds = Array.from(userProjectsMap.keys())
        if (devUserIds.length === 0) {
          setDevelopers([])
          setLoading(false)
          return
        }

        // 2. Fetch profiles for these developer user IDs
        const { data: profilesData, error: profErr } = await supabase
          .from('profiles')
          .select('id, username, display_name, bio, avatar_url, location, created_at, github_url, website_url')
          .in('id', devUserIds)

        if (profErr || !profilesData) {
          setDevelopers([])
          setLoading(false)
          return
        }

        // 3. Aggregate metrics for each developer
        const rawDevList = profilesData.map((item: any) => {
          const userProjects = userProjectsMap.get(item.id) || []
          const appsCount = userProjects.length
          const totalUpvotes = userProjects.reduce((sum: number, p: any) => sum + (p.upvote_count ?? 0), 0)
          const totalViews = userProjects.reduce((sum: number, p: any) => sum + (p.view_count ?? 0), 0)

          return {
            id: item.id,
            username: item.username,
            display_name: item.display_name,
            bio: item.bio,
            avatar_url: item.avatar_url,
            location: item.location,
            created_at: item.created_at,
            github_url: item.github_url,
            website_url: item.website_url,
            published_apps_count: appsCount,
            total_upvotes: totalUpvotes,
            total_views: totalViews,
          }
        })

        // Sort globally by overall contribution score to assign official rank hierarchy
        rawDevList.sort((a, b) => {
          if (b.total_upvotes !== a.total_upvotes) return b.total_upvotes - a.total_upvotes
          if (b.published_apps_count !== a.published_apps_count) return b.published_apps_count - a.published_apps_count
          return b.total_views - a.total_views
        })

        // Assign hierarchical badges based on rank:
        // Rank 1-3   => Gold: "Master Developer"
        // Rank 4-10  => Silver: "Top Creator"
        // Rank 11+   => Bronze: "Campus Contributor"
        const devList: Developer[] = rawDevList.map((dev, index) => {
          const rank = index + 1
          let credibilityBadge: Developer['credibilityBadge']

          if (rank <= 3) {
            credibilityBadge = {
              label: `Master Developer`,
              icon: <Crown size={12} style={{ color: '#E50914' }} />,
            }
          } else if (rank <= 10) {
            credibilityBadge = {
              label: `Top Creator`,
              icon: <Trophy size={12} style={{ color: '#E50914' }} />,
            }
          } else {
            credibilityBadge = {
              label: `Campus Builder`,
              icon: <Award size={12} style={{ color: '#E50914' }} />,
            }
          }

          return {
            ...dev,
            rank,
            credibilityBadge,
          }
        })

        setDevelopers(devList)
      } catch (err) {
        console.error('Failed to load developers:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDevelopers()
  }, [])

  // Filter & Sort developers for display
  const filteredDevelopers = useMemo(() => {
    let result = [...developers]

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        d =>
          (d.display_name && d.display_name.toLowerCase().includes(q)) ||
          d.username.toLowerCase().includes(q) ||
          (d.location && d.location.toLowerCase().includes(q))
      )
    }

    result.sort((a, b) => {
      if (sortBy === 'upvotes') {
        if (b.total_upvotes !== a.total_upvotes) return b.total_upvotes - a.total_upvotes
        return b.published_apps_count - a.published_apps_count
      }
      if (sortBy === 'apps') {
        if (b.published_apps_count !== a.published_apps_count) return b.published_apps_count - a.published_apps_count
        return b.total_upvotes - a.total_upvotes
      }
      // views
      return b.total_views - a.total_views
    })

    return result
  }, [developers, searchQuery, sortBy])

  return (
    <section id="discover-developers" style={{
      maxWidth: '1280px',
      margin: '4rem auto 2rem',
      padding: '0 1.5rem',
      boxSizing: 'border-box',
    }}>
      {/* Netflix Red Neon Gradient Partition Line */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(229, 9, 20, 0.6) 50%, transparent 100%)',
        margin: '1rem 0 2.5rem 0',
      }}>
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: '#E50914',
          boxShadow: '0 0 10px #E50914',
        }} />
      </div>

      <div>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.25rem',
          marginBottom: '1.75rem',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '4px', height: '24px', background: '#E50914', borderRadius: '2px' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em', margin: 0 }}>
                Discover Campus Developers
              </h2>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#E50914',
                background: 'rgba(229, 9, 20, 0.15)',
                padding: '0.15rem 0.6rem',
                borderRadius: '9999px',
                border: '1px solid rgba(229, 9, 20, 0.3)',
              }}>
                {filteredDevelopers.length}
              </span>
            </div>
            <p style={{ color: '#AAAAAA', fontSize: '0.875rem', margin: '0.35rem 0 0 0' }}>
              Explore top campus builders ranked by community impact, upvotes, and published apps.
            </p>
          </div>

          {/* Controls Bar: Search + Sort Pills (Aligned to the Right) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            flexWrap: 'wrap',
            marginLeft: 'auto',
          }}>
            {/* Developer Search Input */}
            <div style={{ position: 'relative', width: '220px', maxWidth: '100%' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#777777' }} />
              <input
                type="text"
                placeholder="Search devs…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.85rem 0.55rem 2.4rem',
                  background: '#1A1A1A',
                  border: '1px solid #2B2B2B',
                  borderRadius: '0.5rem',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#E50914')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2B2B2B')}
              />
            </div>

            {/* Sort options */}
            <div style={{ display: 'flex', gap: '0.3rem', background: '#1A1A1A', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid #2B2B2B', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {[
                { id: 'upvotes', label: 'Top Upvoted', icon: <ThumbsUp size={13} /> },
                { id: 'apps',    label: 'Most Apps',   icon: <Flame size={13} /> },
                { id: 'views',   label: 'Most Viewed', icon: <Eye size={13} /> },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id as DevSortOption)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.78rem',
                    fontWeight: sortBy === opt.id ? 700 : 500,
                    background: sortBy === opt.id ? '#E50914' : 'transparent',
                    color: sortBy === opt.id ? '#FFFFFF' : '#888888',
                    border: 'none',
                    borderRadius: '0.35rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Developers Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: '1.25rem' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '320px', borderRadius: '1rem', background: '#1F1F1F' }} />
            ))}
          </div>
        ) : filteredDevelopers.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3.5rem 1rem',
            background: '#1A1A1A',
            border: '1px dashed #2B2B2B',
            borderRadius: '0.85rem',
          }}>
            <Users size={36} style={{ color: '#555555', marginBottom: '0.75rem' }} />
            <h4 style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 700, margin: '0 0 0.4rem' }}>
              No developers found
            </h4>
            <p style={{ color: '#888888', fontSize: '0.85rem', margin: 0 }}>
              {searchQuery ? `No developers matching "${searchQuery}"` : 'No published developers found yet.'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 290px), 1fr))',
            gap: '1.25rem',
          }}>
            {filteredDevelopers.map(dev => {
              const displayName = dev.display_name || dev.username
              const avatarSrc = dev.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`
              const handle = dev.credibilityBadge?.label
                ? `@${dev.username} • ${dev.credibilityBadge.label}`
                : `@${dev.username}`
              const bio = dev.bio?.trim()
                ? dev.bio
                : `Student developer building apps on AppFlix.`

              const stats = [
                { label: 'Apps', value: dev.published_apps_count },
                { label: 'Upvotes', value: dev.total_upvotes },
                { label: 'Views', value: dev.total_views },
              ]

              const actions = [
                {
                  label: 'View Profile',
                  variant: 'default' as const,
                  onClick: () => router.push(`/developer/${dev.username}`),
                  className: 'bg-[#E50914] hover:bg-[#F40612] text-white font-semibold shadow-[0_2px_12px_rgba(229,9,20,0.35)] transition-all cursor-pointer',
                },
                {
                  label: dev.github_url ? 'GitHub' : 'Explore Apps',
                  variant: 'secondary' as const,
                  onClick: () => {
                    if (dev.github_url) {
                      window.open(dev.github_url, '_blank', 'noopener,noreferrer')
                    } else {
                      router.push(`/developer/${dev.username}`)
                    }
                  },
                  className: 'bg-white/[0.06] hover:bg-white/[0.12] text-white/90 hover:text-white border border-white/[0.1] backdrop-blur-md transition-all cursor-pointer',
                },
              ]

              return (
                <ProfileCard
                  key={dev.id}
                  avatarSrc={avatarSrc}
                  name={displayName}
                  handle={handle}
                  bio={bio}
                  stats={stats}
                  actions={actions}
                  className="max-w-none h-full justify-between hover:border-[#E50914]/50 hover:shadow-[0_16px_40px_rgba(0,0,0,0.8),0_0_24px_rgba(229,9,20,0.22),inset_0_1px_0_rgba(255,255,255,0.12)] hover:-translate-y-1 transition-all duration-300"
                />
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
