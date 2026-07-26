import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Flame, ArrowRight, Zap, Shield, BarChart3, Users, ArrowUp } from 'lucide-react'
import NetflixHorizonDivider from '@/components/ui/NetflixHorizonDivider'
import NetflixTrendingRow from '@/components/projects/NetflixTrendingRow'
import HeroGetStartedButton from '@/components/ui/HeroGetStartedButton'
import NetflixReasonCards from '@/components/ui/NetflixReasonCards'
import NetflixFAQSection from '@/components/ui/NetflixFAQSection'
import NetflixFooterCTA from '@/components/ui/NetflixFooterCTA'

async function getFeaturedProjects() {
  try {
    const supabase = await createServerClient()
    const { data } = await supabase
      .from('projects')
      .select('id, name, slug, tagline, icon_url, upvote_count, stage, platforms, categories(name, slug)')
      .eq('status', 'approved')
      .is('deleted_at', null)
      .order('upvote_count', { ascending: false })
      .limit(10)
    return data ?? []
  } catch {
    return []
  }
}

async function getStats() {
  try {
    const supabase = await createServerClient()
    const [{ count: projects }, { count: categories }] = await Promise.all([
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('categories').select('*', { count: 'exact', head: true }),
    ])
    return { projects: projects ?? 0, categories: categories ?? 0 }
  } catch {
    return { projects: 0, categories: 0 }
  }
}

const FEATURES = [
  { icon: <Zap size={22} style={{ color: '#E50914' }} />, title: 'Submit Your Project', desc: 'List your app in minutes. Add screenshots, links, and a description.' },
  { icon: <Users size={22} style={{ color: '#E50914' }} />, title: 'Community Upvotes', desc: 'Let the community discover and endorse the best student-built apps.' },
  { icon: <BarChart3 size={22} style={{ color: '#E50914' }} />, title: 'Analytics Dashboard', desc: 'Track views, clicks, and upvotes on your projects in real time.' },
  { icon: <Shield size={22} style={{ color: '#E50914' }} />, title: 'Admin Reviewed', desc: 'Every submission is reviewed to keep the showcase high quality.' },
]

export default function HomePage() {
  return <HomeContent />
}

async function HomeContent() {
  const supabase = await createServerClient()
  const [{ data: { user } }, featured, stats] = await Promise.all([
    supabase.auth.getUser(),
    getFeaturedProjects(),
    getStats(),
  ])

  return (
    <main style={{ minHeight: '100vh', background: '#141414' }}>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% -20%, rgba(229,9,20,0.18) 0%, transparent 60%), #141414',
        padding: 'clamp(4rem, 10vw, 7rem) 1.5rem clamp(3rem, 8vw, 5rem)',
        textAlign: 'center',
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

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '760px', margin: '0 auto' }}>
          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(1.75rem, 6.5vw, 4.5rem)', fontWeight: 900,
            letterSpacing: '-0.04em', lineHeight: 1.1,
            marginBottom: '1.25rem', color: '#FFFFFF',
            wordBreak: 'break-word',
          }}>
            Discover & Showcase{' '}
            <span style={{
              background: 'linear-gradient(135deg, #E50914 0%, #FF6B6B 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              display: 'inline-block',
            }}>
              Student Projects
            </span>
          </h1>

          {/* Subheading */}
          <p style={{
            fontSize: 'clamp(0.88rem, 3.5vw, 1.2rem)', color: '#AAAAAA',
            maxWidth: '560px', margin: '0 auto 2.5rem', lineHeight: 1.6,
          }}>
            AppFlix is where your university&apos;s builders, hackers, and innovators share their work — and get discovered.
          </p>

          {/* Netflix email form styled get-started bar */}
          <p style={{
            fontSize: '0.85rem',
            color: '#DDDDDD',
            marginBottom: '0.85rem',
            fontWeight: 500,
          }}>
            Ready to explore? Browse student apps or list your app.
          </p>

          <div className="hero-search-form" style={{
            display: 'flex',
            maxWidth: '560px',
            margin: '0 auto 1rem',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7)',
          }}>
            <Link
              href="/browse"
              style={{
                flex: 1,
                padding: '1rem 1.2rem',
                background: 'rgba(15, 15, 15, 0.75)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRight: 'none',
                borderRadius: '4px 0 0 4px',
                color: '#AAAAAA',
                fontSize: '1rem',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              Discover student apps…
            </Link>
            <HeroGetStartedButton />
          </div>

          <p style={{
            color: '#888888',
            fontSize: '0.78rem',
            marginBottom: '2rem',
          }}>
            Free for all university student innovators.
          </p>

          {/* Stats */}
          {(stats.projects > 0 || stats.categories > 0) && (
            <div style={{
              display: 'flex', gap: '1.25rem', justifyContent: 'center',
              marginTop: '2.5rem', flexWrap: 'wrap',
              marginBottom: '1.5rem',
            }}>
              {[
                { value: stats.projects.toString(), label: 'Apps listed' },
                { value: stats.categories.toString(), label: 'Categories' },
                { value: 'Free', label: 'Always free' },
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: 'center', minWidth: '80px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: '0.75rem', color: '#888888', marginTop: '0.3rem' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Content Section (Overlaying Hero) ────────────────────── */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* Netflix Horizon Arc Divider Overlay */}
        <NetflixHorizonDivider fillColor="#141414" />

        <div style={{ background: '#141414', minHeight: '60vh' }}>
          {/* Netflix Trending Top 10 Row */}
          <NetflixTrendingRow projects={featured} title="Trending Now" />

      {/* ── Featured Projects ─────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section style={{ padding: '2rem 0.85rem', maxWidth: '1280px', margin: '0 auto', boxSizing: 'border-box', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <div className="accent-line" style={{ width: '2rem', marginBottom: '0.5rem' }} />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                Top Apps
              </h2>
            </div>
            <Link href="/browse" style={{ color: '#E50914', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
              View all →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '0.75rem', width: '100%' }}>
            {(featured as any[]).map((project) => (
              <Link key={project.id} href={`/browse/${project.slug}`} style={{ textDecoration: 'none', display: 'block', minWidth: 0, width: '100%' }}>
                <div className="card-hover" style={{
                  background: 'linear-gradient(145deg, #0F0F0F 0%, #080808 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem 0.85rem',
                  minHeight: '78px',
                  display: 'flex',
                  gap: '0.65rem',
                  alignItems: 'center',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  width: '100%',
                  maxWidth: '100%',
                }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '0.65rem',
                    background: '#161616', border: '1px solid rgba(255, 255, 255, 0.1)',
                    flexShrink: 0, overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {project.icon_url
                      ? <img src={project.icon_url} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <Flame size={20} style={{ color: '#444' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.15rem',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {project.name}
                    </h3>
                    <p style={{
                      fontSize: '0.78rem', color: '#AAAAAA', margin: 0, lineHeight: 1.3,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {project.tagline}
                    </p>
                  </div>
                  <div style={{
                    flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    background: 'rgba(229, 9, 20, 0.12)', border: '1px solid rgba(229, 9, 20, 0.3)',
                    borderRadius: '0.45rem', padding: '0.35rem 0.6rem',
                  }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF' }}>{project.upvote_count}</span>
                    <ArrowUp size={13} strokeWidth={2.75} style={{ color: '#E50914' }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── More reasons to join (Netflix visual style cards) ──────────────── */}
      <NetflixReasonCards />

      {/* ── Frequently Asked Questions (Netflix Accordion style) ───────────── */}
      <NetflixFAQSection />

      </div>
      </div>

      {/* ── Netflix Get Started CTA Form & Black Footer Area ────────────────── */}
      <NetflixFooterCTA isAuthenticated={!!user} />
    </main>
  )
}
