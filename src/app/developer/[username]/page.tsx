import { createServerClient } from '@/lib/supabase/server'
import { applyPublicVisibilityFilter } from '@/lib/supabase/public-queries'
import { notFound } from 'next/navigation'

import Link from 'next/link'
import {
  Globe, GitBranch, Link2, AtSign, MapPin, Calendar, ArrowUpRight,
  BarChart2, Flame, ThumbsUp, Mail, Code2, Sparkles, ExternalLink
} from 'lucide-react'
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
    .ilike('username', username)
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

  // 1. Fetch base profile (using case-insensitive .ilike for resilient username matching)
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, avatar_url, website_url, github_url, linkedin_url, twitter_handle, location, created_at')
    .ilike('username', username)
    .single()

  if (!profile) {
    notFound()
  }

  // 2. Fetch approved active projects by this developer (using public visibility filter)
  const baseQuery = supabase
    .from('projects')
    .select('id, name, slug, tagline, icon_url, upvote_count, view_count, stage, platforms, categories(name, slug)')
    .eq('user_id', profile.id)

  const { data: projects } = await applyPublicVisibilityFilter(baseQuery)
    .order('upvote_count', { ascending: false })


  const projectsList = (projects as any[]) ?? []

  // Compute total views and upvotes
  const totalViews = projectsList.reduce((sum, p) => sum + (p.view_count ?? 0), 0)
  const totalUpvotes = projectsList.reduce((sum, p) => sum + (p.upvote_count ?? 0), 0)

  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })

  const STAGE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
    beta:       { bg: 'rgba(243,156,18,0.15)',  color: '#F39C12', border: 'rgba(243,156,18,0.3)' },
    production: { bg: 'rgba(46,204,113,0.15)',  color: '#2ECC71', border: 'rgba(46,204,113,0.3)' },
  }

  const socialLinks = [
    (profile as any).email ? { type: 'email', label: 'Email', value: (profile as any).email, href: `mailto:${(profile as any).email}`, icon: <Mail size={14} /> } : null,
    profile.website_url ? { type: 'website', label: 'Website', value: profile.website_url.replace(/^https?:\/\//, ''), href: profile.website_url, icon: <Globe size={14} /> } : null,
    profile.github_url ? { type: 'github', label: 'GitHub', value: profile.github_url.replace(/^https?:\/\/(www\.)?github\.com\//, ''), href: profile.github_url, icon: <GitBranch size={14} /> } : null,
    profile.linkedin_url ? { type: 'linkedin', label: 'LinkedIn', value: profile.linkedin_url.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, ''), href: profile.linkedin_url, icon: <Link2 size={14} /> } : null,
    profile.twitter_handle ? { type: 'twitter', label: 'Twitter / X', value: `@${profile.twitter_handle.replace(/^@/, '')}`, href: `https://x.com/${profile.twitter_handle.replace(/^@/, '')}`, icon: <AtSign size={14} /> } : null,
  ].filter(Boolean)

  return (
    <div style={{ minHeight: '100vh', background: '#141414', color: '#FFFFFF' }}>
      {/* ── 1. Hero Developer Card Header ── */}
      <div style={{
        background: 'radial-gradient(ellipse at top, rgba(229, 9, 20, 0.15) 0%, rgba(20, 20, 20, 0.98) 70%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '3.5rem 1.5rem 2.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1.75rem',
            flexWrap: 'wrap',
          }}>
            {/* Avatar with Glow Ring */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: '100px', height: '100px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #E50914 0%, #B20710 100%)',
                border: '3px solid rgba(229, 9, 20, 0.5)',
                overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.4rem', fontWeight: 900, color: '#FFFFFF',
                boxShadow: '0 10px 30px rgba(229, 9, 20, 0.35)',
              }}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.display_name || profile.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (profile.display_name || profile.username)[0].toUpperCase()
                )}
              </div>
              <div style={{
                position: 'absolute',
                bottom: '4px',
                right: '4px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#2ECC71',
                border: '3px solid #141414',
                boxShadow: '0 0 10px #2ECC71',
              }} title="Verified Developer" />
            </div>

            {/* Developer Metadata */}
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.25rem)', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em', margin: 0 }}>
                  {profile.display_name || `@${profile.username}`}
                </h1>
                <span style={{
                  background: 'rgba(229, 9, 20, 0.15)',
                  border: '1px solid rgba(229, 9, 20, 0.3)',
                  color: '#FF6B6B',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.65rem',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}>
                  <Code2 size={12} /> App Developer
                </span>
              </div>

              <p style={{ fontSize: '0.9rem', color: '#AAAAAA', margin: '0.25rem 0 0.85rem 0', fontWeight: 500 }}>
                @{profile.username}
              </p>

              {/* Bio Section */}
              {profile.bio && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '0.65rem',
                  padding: '0.85rem 1.1rem',
                  marginBottom: '1.2rem',
                  maxWidth: '680px',
                }}>
                  <p style={{ fontSize: '0.88rem', color: '#DDDDDD', lineHeight: 1.6, margin: 0 }}>
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* Location & Joined Date */}
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.2rem', fontSize: '0.82rem', color: '#888888' }}>
                {profile.location && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <MapPin size={14} style={{ color: '#E50914' }} /> {profile.location}
                  </span>
                )}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} style={{ color: '#888888' }} /> Joined {joinDate}
                </span>
              </div>

              {/* ── All Social & Contact Links ── */}
              {socialLinks.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#777777', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>
                    Developer Links & Socials
                  </h4>
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    {socialLinks.map((link: any) => (
                      <a
                        key={link.type}
                        href={link.href}
                        target={link.type === 'email' ? undefined : '_blank'}
                        rel={link.type === 'email' ? undefined : 'noopener noreferrer'}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          background: '#1F1F1F',
                          border: '1px solid #2B2B2B',
                          borderRadius: '0.5rem',
                          padding: '0.45rem 0.85rem',
                          color: '#FFFFFF',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                          transition: 'all 0.2s',
                        }}
                      >
                        <span style={{ color: '#E50914' }}>{link.icon}</span>
                        <span>{link.label}: <strong style={{ color: '#CCCCCC' }}>{link.value}</strong></span>
                        {link.type !== 'email' && <ExternalLink size={11} style={{ color: '#666666', marginLeft: '0.15rem' }} />}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.85rem',
            marginTop: '2rem',
            maxWidth: '520px',
          }}>
            {[
              { label: 'Published Apps', value: projectsList.length, icon: <Flame size={15} /> },
              { label: 'Total Views', value: totalViews.toLocaleString(), icon: <BarChart2 size={15} /> },
              { label: 'Total Upvotes', value: totalUpvotes.toLocaleString(), icon: <ThumbsUp size={15} /> },
            ].map(stat => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '0.75rem',
                padding: '0.85rem 1rem',
                textAlign: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', color: '#E50914', marginBottom: '0.3rem' }}>
                  {stat.icon}
                </div>
                <p style={{ fontSize: '1.35rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1, margin: 0 }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: '0.7rem', color: '#888888', marginTop: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 2. Published Apps Grid ── */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
        }}>
          <h2 style={{
            fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em',
            margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem',
          }}>
            <Sparkles size={18} style={{ color: '#E50914' }} />
            Published Apps & Projects
            <span style={{
              fontSize: '0.75rem', color: '#AAAAAA', background: '#262626',
              padding: '0.15rem 0.55rem', borderRadius: '9999px', fontWeight: 700
            }}>
              {projectsList.length}
            </span>
          </h2>
        </div>

        {projectsList.length === 0 ? (
          <div style={{
            background: '#1F1F1F', border: '1px dashed #2B2B2B',
            borderRadius: '0.85rem', padding: '3.5rem 1.5rem',
            textAlign: 'center',
          }}>
            <Globe size={36} style={{ color: '#444444', marginBottom: '0.75rem' }} />
            <h4 style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 700, margin: '0 0 0.4rem' }}>
              No published apps yet
            </h4>
            <p style={{ color: '#888888', fontSize: '0.85rem', margin: 0 }}>
              This developer has not published any live apps on AppFlix yet.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.2rem',
          }}>
            {projectsList.map((project: any) => {
              const stage = STAGE_COLORS[project.stage] ?? { bg: 'rgba(229,9,20,0.15)', color: '#E50914', border: 'rgba(229,9,20,0.3)' }

              return (
                <Link
                  key={project.id}
                  href={`/browse/${project.slug}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div style={{
                    background: '#1A1A1A',
                    border: '1px solid #2B2B2B',
                    borderRadius: '0.85rem',
                    padding: '1.25rem',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                  }}>
                    <div>
                      <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        {/* Icon */}
                        <div style={{
                          width: '52px', height: '52px', borderRadius: '0.75rem',
                          background: '#242424', border: '1px solid #333333',
                          overflow: 'hidden', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {project.icon_url ? (
                            <img src={project.icon_url} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Globe size={22} style={{ color: '#666' }} />
                          )}
                        </div>

                        {/* Title & Arrow */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {project.name}
                            </h3>
                            <ArrowUpRight size={16} style={{ color: '#888888', flexShrink: 0 }} />
                          </div>
                          {project.categories?.name && (
                            <span style={{ fontSize: '0.72rem', color: '#AAAAAA', fontWeight: 600 }}>
                              {project.categories.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tagline */}
                      <p style={{ fontSize: '0.82rem', color: '#CCCCCC', lineHeight: 1.5, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {project.tagline}
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '1rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid #262626',
                    }}>
                      <span style={{
                        fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                        padding: '0.2rem 0.6rem', borderRadius: '9999px',
                        background: stage.bg, color: stage.color, border: `1px solid ${stage.border}`,
                      }}>
                        {project.stage}
                      </span>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.78rem', color: '#888888' }}>
                        <span>👁️ {project.view_count ?? 0}</span>
                        <span style={{ color: '#E50914', fontWeight: 700 }}>▲ {project.upvote_count ?? 0}</span>
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
