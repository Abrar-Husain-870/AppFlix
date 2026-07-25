import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Flame, ArrowRight, Zap, Shield, BarChart3, Users } from 'lucide-react'
import NetflixHorizonDivider from '@/components/ui/NetflixHorizonDivider'
import NetflixTrendingRow from '@/components/projects/NetflixTrendingRow'
import HeroGetStartedButton from '@/components/ui/HeroGetStartedButton'
import NetflixReasonCards from '@/components/ui/NetflixReasonCards'
import NetflixFAQSection from '@/components/ui/NetflixFAQSection'

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

export default async function HomePage() {
  const [featured, stats] = await Promise.all([getFeaturedProjects(), getStats()])

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

        {/* Multi-layer dark overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(20,20,20,0.15) 0%, rgba(20,20,20,0.35) 50%, rgba(20,20,20,0.92) 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '760px', margin: '0 auto' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(229,9,20,0.12)', border: '1px solid rgba(229,9,20,0.3)',
            borderRadius: '9999px', padding: '0.35rem 1rem',
            color: '#E50914', fontSize: '0.8rem', fontWeight: 700,
            letterSpacing: '0.04em', marginBottom: '1.5rem',
          }}>
            <Flame size={13} />
            The Product Hunt for Your University
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900,
            letterSpacing: '-0.04em', lineHeight: 1.05,
            marginBottom: '1.25rem', color: '#FFFFFF',
          }}>
            Discover & Showcase{' '}
            <span style={{
              background: 'linear-gradient(135deg, #E50914 0%, #FF6B6B 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Student Projects
            </span>
          </h1>

          {/* Subheading */}
          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: '#AAAAAA',
            maxWidth: '560px', margin: '0 auto 2.5rem', lineHeight: 1.65,
          }}>
            AppFlix is where your university&apos;s builders, hackers, and innovators share their work — and get discovered.
          </p>

          {/* Netflix email form styled get-started bar */}
          <p style={{
            fontSize: '0.95rem',
            color: '#DDDDDD',
            marginBottom: '0.85rem',
            fontWeight: 500,
          }}>
            Ready to explore? Browse student apps or list your project.
          </p>

          <div style={{
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
              Discover student projects…
            </Link>
            <HeroGetStartedButton />
          </div>

          <p style={{
            color: '#888888',
            fontSize: '0.8rem',
            marginBottom: '2rem',
          }}>
            Free for all university student innovators.
          </p>

          {/* Stats */}
          {(stats.projects > 0 || stats.categories > 0) && (
            <div style={{
              display: 'flex', gap: '2.5rem', justifyContent: 'center',
              marginTop: '3rem', flexWrap: 'wrap',
            }}>
              {[
                { value: stats.projects.toString(), label: 'Projects listed' },
                { value: stats.categories.toString(), label: 'Categories' },
                { value: 'Free', label: 'Always free' },
              ].map(stat => (
                <div key={stat.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.3rem' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Content Section (Overlaying Hero) ────────────────────── */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* Netflix Horizon Arc Divider Overlay */}
        <NetflixHorizonDivider fillColor="#080808" />

        <div style={{ background: '#080808', minHeight: '60vh' }}>
          {/* Netflix Trending Top 10 Row */}
          <NetflixTrendingRow projects={featured} title="Trending Now" />

      {/* ── Featured Projects ─────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section style={{ padding: '3rem 1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <div className="accent-line" style={{ width: '2rem', marginBottom: '0.5rem' }} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                Top Projects
              </h2>
            </div>
            <Link href="/browse" style={{ color: '#E50914', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
              View all →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {(featured as any[]).map((project) => (
              <Link key={project.id} href={`/browse/${project.slug}`} style={{ textDecoration: 'none' }}>
                <div className="card-hover" style={{
                  background: '#1F1F1F', borderRadius: '0.75rem',
                  padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '0.65rem',
                    background: '#262626', border: '1px solid #2B2B2B',
                    flexShrink: 0, overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {project.icon_url
                      ? <img src={project.icon_url} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <Flame size={20} style={{ color: '#444' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.2rem' }}>
                      {project.name}
                    </h3>
                    <p style={{
                      fontSize: '0.8rem', color: '#AAAAAA', lineHeight: 1.4,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {project.tagline}
                    </p>
                  </div>
                  <div style={{
                    flexShrink: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: '0.1rem',
                  }}>
                    <span style={{ color: '#E50914', fontSize: '0.7rem' }}>▲</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF' }}>{project.upvote_count}</span>
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

      {/* ── CTA Banner ────────────────────────────────────────────────── */}
      <section style={{
        padding: '3rem 1.5rem',
        background: 'linear-gradient(135deg, rgba(229,9,20,0.08) 0%, rgba(229,9,20,0.03) 100%)',
        borderTop: '1px solid rgba(229,9,20,0.15)',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
          Ready to share your project?
        </h2>
        <p style={{ color: '#AAAAAA', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Join your university&apos;s growing community of builders.
        </p>
        <Link
          href="/signup"
          id="cta-signup-btn"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.85rem 2rem', background: '#E50914',
            color: '#FFFFFF', fontWeight: 700, fontSize: '1rem',
            borderRadius: '0.6rem', textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(229,9,20,0.35)',
          }}
        >
          Get started — it&apos;s free <ArrowRight size={18} />
        </Link>
      </section>
      </div>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #2B2B2B', padding: '1.5rem',
        textAlign: 'center', color: '#555', fontSize: '0.8rem',
      }}>
        © {new Date().getFullYear()} AppFlix · Built for student innovators
      </footer>
    </main>
  )
}
