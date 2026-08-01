import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Globe, GitBranch, Link2, AtSign, MapPin, Calendar, ArrowUpRight, BarChart2, Flame, ThumbsUp } from 'lucide-react'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const supabase = await createServerClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, username, bio, avatar_url')
    .eq('username', username)
    .single()

  if (!profile) return { title: 'Developer Not Found' }

  const name = profile.display_name || `@${profile.username}`
  return {
    title: `${name} — Developer Profile | AppFlix`,
    description: profile.bio || `Explore apps published by ${name} on AppFlix.`,
    openGraph: {
      title: `${name} on AppFlix`,
      description: profile.bio || `Explore apps published by ${name} on AppFlix.`,
      images: profile.avatar_url ? [profile.avatar_url] : [],
    },
  }
}

export default async function DeveloperProfilePage({ params }: Props) {
  const { username } = await params
  const supabase = await createServerClient()

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, avatar_url, website_url, github_url, linkedin_url, twitter_handle, location, created_at')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  // Fetch approved projects by this developer
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, slug, tagline, icon_url, upvote_count, view_count, stage, platforms, categories(name, slug)')
    .eq('user_id', profile.id)
    .eq('status', 'approved')
    .is('deleted_at', null)
    .order('upvote_count', { ascending: false })

  const projectsList = (projects as any[]) ?? []

  // Compute stats
  const totalViews = projectsList.reduce((sum, p) => sum + (p.view_count ?? 0), 0)
  const totalUpvotes = projectsList.reduce((sum, p) => sum + (p.upvote_count ?? 0), 0)

  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })

  const STAGE_COLORS: Record<string, { bg: string; color: string }> = {
    beta:       { bg: 'rgba(243,156,18,0.15)',  color: '#F39C12' },
    production: { bg: 'rgba(46,204,113,0.15)',  color: '#2ECC71' },
  }

  return (
    <div style={{ minHeight: '100vh', background: '#141414' }}>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(180deg, #1A0A0A 0%, #141414 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '3rem 1.5rem 2rem',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: '88px', height: '88px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #E50914 0%, #B20710 100%)',
              border: '3px solid rgba(229,9,20,0.35)',
              overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', fontWeight: 900, color: '#FFFFFF',
              boxShadow: '0 8px 24px rgba(229,9,20,0.25)',
            }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.display_name || profile.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (profile.display_name || profile.username)[0].toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: '220px' }}>
              <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em', marginBottom: '0.2rem' }}>
                {profile.display_name || `@${profile.username}`}
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.65rem' }}>
                @{profile.username}
              </p>

              {profile.bio && (
                <p style={{ fontSize: '0.9rem', color: '#AAAAAA', lineHeight: 1.6, maxWidth: '520px', marginBottom: '0.75rem' }}>
                  {profile.bio}
                </p>
              )}

              {/* Meta row */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {profile.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#666' }}>
                    <MapPin size={12} /> {profile.location}
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#666' }}>
                  <Calendar size={12} /> Joined {joinDate}
                </span>

                {/* Social links */}
                {profile.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="dev-social-link">
                    <GitBranch size={13} /> GitHub
                  </a>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="dev-social-link">
                    <Link2 size={13} /> LinkedIn
                  </a>
                )}
                {profile.website_url && (
                  <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="dev-social-link">
                    <Globe size={13} /> Website
                  </a>
                )}
                {profile.twitter_handle && (
                  <a href={`https://twitter.com/${profile.twitter_handle}`} target="_blank" rel="noopener noreferrer" className="dev-social-link">
                    <AtSign size={13} /> @{profile.twitter_handle}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            marginTop: '2rem',
            maxWidth: '420px',
          }}>
            {[
              { label: 'Apps Published', value: projectsList.length, icon: <Flame size={14} /> },
              { label: 'Total Views', value: totalViews.toLocaleString(), icon: <BarChart2 size={14} /> },
              { label: 'Total Upvotes', value: totalUpvotes.toLocaleString(), icon: <ThumbsUp size={14} /> },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '0.65rem',
                padding: '0.75rem 1rem',
                textAlign: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', color: '#E50914', marginBottom: '0.3rem' }}>
                  {stat.icon}
                </div>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: '0.7rem', color: '#666', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <h2 style={{
          fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em',
          marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <span style={{ width: '3px', height: '1rem', background: '#E50914', borderRadius: '2px', display: 'inline-block' }} />
          Published Apps
          <span style={{ fontSize: '0.75rem', color: '#555', fontWeight: 500, marginLeft: '0.25rem' }}>({projectsList.length})</span>
        </h2>

        {projectsList.length === 0 ? (
          <div style={{
            background: '#1F1F1F', border: '1px solid #2B2B2B',
            borderRadius: '0.85rem', padding: '3rem',
            textAlign: 'center',
          }}>
            <p style={{ color: '#555', fontSize: '0.9rem' }}>No published apps yet.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
          }}>
            {projectsList.map((project: any) => {
              const stage = STAGE_COLORS[project.stage] ?? { bg: 'rgba(229,9,20,0.15)', color: '#E50914' }
              const bannerImg = project.project_images?.[0]?.image_url ?? null

              return (
                <Link
                  key={project.id}
                  href={`/browse/${project.slug}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div className="dev-project-card">
                    <div style={{ padding: '1rem', display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                      {/* Icon */}
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '0.7rem',
                        background: '#1F1F1F', border: '1px solid #2B2B2B',
                        overflow: 'hidden', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {project.icon_url
                          ? <img src={project.icon_url} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <Globe size={20} style={{ color: '#444' }} />}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <h3 style={{ fontSize: '0.925rem', fontWeight: 700, color: '#FFFFFF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {project.name}
                          </h3>
                          <ArrowUpRight size={14} style={{ color: '#555', flexShrink: 0 }} />
                        </div>
                        <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '0.2rem', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {project.tagline}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.65rem', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                            padding: '0.2rem 0.55rem', borderRadius: '9999px',
                            background: stage.bg, color: stage.color,
                          }}>
                            {project.stage}
                          </span>
                          {project.categories?.name && (
                            <span style={{ fontSize: '0.7rem', color: '#666', background: '#1A1A1A', border: '1px solid #2B2B2B', padding: '0.15rem 0.5rem', borderRadius: '0.3rem' }}>
                              {project.categories.name}
                            </span>
                          )}
                          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#888', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            ▲ {project.upvote_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
