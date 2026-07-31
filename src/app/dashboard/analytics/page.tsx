'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  BarChart3, Eye, TrendingUp, MousePointer, ArrowUpRight,
  Bookmark, Users, Lightbulb, Monitor, Smartphone, Tablet,
  ArrowUp, ArrowDown, Minus, Tag,
} from 'lucide-react'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Project { id: string; name: string; upvote_count: number; bookmark_count: number }
interface EventRow {
  event_type: string
  created_at: string
  user_id: string | null
  visitor_id: string | null
  device_type: 'mobile' | 'tablet' | 'desktop' | null
  project_id: string
}
interface TagRow { name: string }

const PERIODS = [
  { label: '7d',  days: 7  },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

// ─────────────────────────────────────────────
// Sub-components (clearly named for easy swap)
// ─────────────────────────────────────────────

/** SWAPPABLE — Replace with Recharts/Chart.js bar chart */
function ViewsChart({ data, color = '#5B8DEF' }: { data: number[]; color?: string }) {
  if (!data.length) return null
  const max = Math.max(...data, 1)
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '70px' }}>
      {data.map((v, i) => (
        <div key={i} title={String(v)} style={{
          flex: 1, minWidth: '6px',
          height: `${Math.max((v / max) * 100, 2)}%`,
          background: v > 0 ? color : '#262626',
          borderRadius: '2px 2px 0 0',
          transition: 'height 0.3s',
          opacity: 0.55 + (i / data.length) * 0.45,
        }} />
      ))}
    </div>
  )
}

/** SWAPPABLE — Replace with Recharts/Chart.js bar chart for clicks */
function ClicksChart({ data, color = '#E50914' }: { data: number[]; color?: string }) {
  return <ViewsChart data={data} color={color} />
}

/** SWAPPABLE — Replace with Recharts/Chart.js pie or donut chart */
function DeviceBreakdown({ mobile, tablet, desktop }: { mobile: number; tablet: number; desktop: number }) {
  const total = mobile + tablet + desktop || 1
  const pct = (n: number) => Math.round((n / total) * 100)
  const bars = [
    { label: 'Mobile',  icon: <Smartphone size={14} />, value: pct(mobile),  color: '#E50914', count: mobile },
    { label: 'Desktop', icon: <Monitor size={14} />,    value: pct(desktop), color: '#5B8DEF', count: desktop },
    { label: 'Tablet',  icon: <Tablet size={14} />,     value: pct(tablet),  color: '#F59E0B', count: tablet },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {bars.map(b => (
        <div key={b.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#AAAAAA', fontSize: '0.82rem' }}>
              {b.icon} {b.label}
            </span>
            <span style={{ fontSize: '0.82rem', color: '#FFFFFF', fontWeight: 600 }}>
              {b.value}% <span style={{ color: '#555', fontWeight: 400 }}>({b.count})</span>
            </span>
          </div>
          <div style={{ background: '#2B2B2B', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
            <div style={{
              width: `${b.value}%`, height: '100%',
              background: b.color, borderRadius: '4px',
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// Stat card with growth indicator
// ─────────────────────────────────────────────
function StatCard({
  icon, label, value, current, previous,
}: {
  icon: React.ReactNode; label: string; value: number | string;
  current?: number; previous?: number
}) {
  let growthEl: React.ReactNode = null
  if (current !== undefined && previous !== undefined) {
    if (previous === 0 && current === 0) {
      growthEl = <span style={{ fontSize: '0.72rem', color: '#555', display: 'flex', alignItems: 'center', gap: '2px' }}><Minus size={10} /> No data</span>
    } else if (previous === 0) {
      growthEl = <span style={{ fontSize: '0.72rem', color: '#2ECC71', display: 'flex', alignItems: 'center', gap: '2px' }}><ArrowUp size={10} /> New</span>
    } else {
      const pct = Math.round(((current - previous) / previous) * 100)
      const up = pct >= 0
      growthEl = (
        <span style={{
          fontSize: '0.72rem',
          color: up ? '#2ECC71' : '#E74C3C',
          display: 'flex', alignItems: 'center', gap: '2px',
        }}>
          {up ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
          {up ? '+' : ''}{pct}% vs prior
        </span>
      )
    }
  }

  return (
    <div style={{
      background: 'linear-gradient(145deg, #1A1A1A 0%, #161616 100%)',
      border: '1px solid #2B2B2B', borderRadius: '0.85rem',
      padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ color: '#555' }}>{icon}</span>
        {growthEl}
      </div>
      <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.78rem', color: '#888' }}>{label}</div>
    </div>
  )
}

// ─────────────────────────────────────────────
// AI Insight card (rule-based, not LLM)
// ─────────────────────────────────────────────
function AiInsightCard({
  views, clicks, ctr, bookmarks, upvotes, mobileRatio, period,
}: {
  views: number; clicks: number; ctr: number; bookmarks: number; upvotes: number; mobileRatio: number; period: number
}) {
  const insights: string[] = []

  if (ctr > 15) insights.push(`🔥 Your CTR of ${ctr.toFixed(1)}% is excellent — most apps average under 10%.`)
  else if (ctr > 5) insights.push(`📈 Your CTR is ${ctr.toFixed(1)}%. Consider a stronger call-to-action on your app page.`)
  else if (views > 10 && ctr < 5) insights.push(`💡 Low CTR (${ctr.toFixed(1)}%) despite ${views} views. Try updating your app's headline or external link button text.`)

  if (mobileRatio > 60) insights.push(`📱 ${Math.round(mobileRatio)}% of your visitors are on mobile — make sure your external website is mobile-friendly.`)

  if (bookmarks > upvotes * 2) insights.push(`🔖 You have ${bookmarks} bookmarks but fewer upvotes. Remind visitors to upvote — bookmarkers are already interested!`)

  if (upvotes > 10) insights.push(`⭐ Strong upvote count (${upvotes}). Share your app page link to drive more organic discovery.`)

  if (views === 0) insights.push(`👀 No views yet in the last ${period} days. Share your app link in social media or student groups.`)
  else if (views < 10) insights.push(`📣 Only ${views} views so far. Share your app link in more channels to grow reach.`)

  if (insights.length === 0) insights.push(`✅ Your app is live. Keep sharing your link to grow views and engagement.`)

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(229,9,20,0.06) 0%, rgba(91,141,239,0.06) 100%)',
      border: '1px solid rgba(229,9,20,0.2)', borderRadius: '0.85rem',
      padding: '1.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
        <Lightbulb size={18} style={{ color: '#F59E0B' }} />
        <h3 style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>AI Insights</h3>
        <span style={{ fontSize: '0.68rem', color: '#555', marginLeft: 'auto', padding: '0.15rem 0.5rem', background: '#2B2B2B', borderRadius: '9999px' }}>Rule-based</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {insights.map((ins, i) => (
          <p key={i} style={{ color: '#CCCCCC', fontSize: '0.875rem', lineHeight: 1.55, margin: 0,
            paddingLeft: '0.85rem', borderLeft: '2px solid rgba(229,9,20,0.35)' }}>
            {ins}
          </p>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function AnalyticsPage() {
  const [projects, setProjects]       = useState<Project[]>([])
  const [selectedProject, setSelected] = useState<string>('all')
  const [period, setPeriod]           = useState(30)
  const [events, setEvents]           = useState<EventRow[]>([])
  const [prevEvents, setPrevEvents]   = useState<EventRow[]>([])
  const [tags, setTags]               = useState<TagRow[]>([])
  const [loading, setLoading]         = useState(true)

  // Load developer's projects + tags once
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = '/login'; return }
      const uid = data.user.id

      const [{ data: projs }, { data: tagRows }] = await Promise.all([
        supabase.from('projects')
          .select('id, name, upvote_count, bookmark_count')
          .eq('user_id', uid)
          .is('deleted_at', null)
          .order('created_at', { ascending: false }),
        supabase.from('project_tags')
          .select('tags(name)')
          .in('project_id', ((await supabase.from('projects').select('id').eq('user_id', uid).is('deleted_at', null)).data ?? []).map((p: any) => p.id))
      ])
      setProjects((projs as Project[]) ?? [])
      // Flatten tags
      const flat: TagRow[] = []
      ;(tagRows ?? []).forEach((r: any) => {
        if (r.tags?.name) flat.push({ name: r.tags.name })
      })
      setTags(flat)
    })
  }, [])

  // Load events for current + prior period when filters change
  useEffect(() => {
    if (!projects.length) return
    setLoading(true)
    const supabase = createClient()
    const now = Date.now()
    const since      = new Date(now - period * 86400000).toISOString()
    const priorStart = new Date(now - 2 * period * 86400000).toISOString()
    const projectIds = projects.map(p => p.id)
    const filterIds  = selectedProject !== 'all' ? [selectedProject] : projectIds

    Promise.all([
      // Current period events
      supabase.from('analytics_events')
        .select('event_type, created_at, user_id, visitor_id, device_type, project_id')
        .gte('created_at', since)
        .in('project_id', filterIds),
      // Prior period events (for growth comparison)
      supabase.from('analytics_events')
        .select('event_type, created_at, user_id, visitor_id, device_type, project_id')
        .gte('created_at', priorStart)
        .lt('created_at', since)
        .in('project_id', filterIds),
    ]).then(([cur, prev]) => {
      setEvents((cur.data as EventRow[]) ?? [])
      setPrevEvents((prev.data as EventRow[]) ?? [])
      setLoading(false)
    })
  }, [projects, selectedProject, period])

  // ── Derived metrics ──────────────────────────
  const views   = events.filter(e => e.event_type === 'view').length
  const clicks  = events.filter(e => e.event_type === 'click_external').length
  const ctr     = views > 0 ? (clicks / views) * 100 : 0

  // Bookmarks: read from projects.bookmark_count (maintained by DB trigger, not RLS-blocked)
  // This is the all-time total — not period-filtered, but accurate for every user who bookmarked
  const totalBookmarks = selectedProject === 'all'
    ? projects.reduce((a, p) => a + (p.bookmark_count || 0), 0)
    : (projects.find(p => p.id === selectedProject)?.bookmark_count || 0)

  const totalDbUpvotes = selectedProject === 'all'
    ? projects.reduce((a, p) => a + (p.upvote_count || 0), 0)
    : (projects.find(p => p.id === selectedProject)?.upvote_count || 0)
  const upvotes = Math.max(events.filter(e => e.event_type === 'upvote').length, totalDbUpvotes)

  // Unique visitors: distinct user_id OR visitor_id on view events
  const uniqueVisitors = new Set(
    events.filter(e => e.event_type === 'view').map(e => e.user_id ?? e.visitor_id)
  ).size

  // Prior period
  const pViews   = prevEvents.filter(e => e.event_type === 'view').length
  const pClicks  = prevEvents.filter(e => e.event_type === 'click_external').length
  const pCtr     = pViews > 0 ? (pClicks / pViews) * 100 : 0
  const pUpvotes = prevEvents.filter(e => e.event_type === 'upvote').length
  const pUnique  = new Set(prevEvents.filter(e => e.event_type === 'view').map(e => e.user_id ?? e.visitor_id)).size

  // Device breakdown (real data)
  const viewEvents = events.filter(e => e.event_type === 'view')
  const devMobile  = viewEvents.filter(e => e.device_type === 'mobile').length
  const devTablet  = viewEvents.filter(e => e.device_type === 'tablet').length
  const devDesktop = viewEvents.filter(e => e.device_type === 'desktop').length
  const devTotal   = devMobile + devTablet + devDesktop || 1
  const mobileRatio = (devMobile / devTotal) * 100

  // Per-project stats for Top Performing Projects table
  const perProject = projects.map(p => {
    const pv = events.filter(e => e.project_id === p.id && e.event_type === 'view').length
    const pc = events.filter(e => e.project_id === p.id && e.event_type === 'click_external').length
    return {
      id: p.id, name: p.name,
      views: pv, clicks: pc,
      ctr: pv > 0 ? ((pc / pv) * 100).toFixed(1) : '0.0',
      upvotes: p.upvote_count,
      bookmarks: p.bookmark_count,
    }
  }).sort((a, b) => b.views - a.views)

  // Popular tags (deduplicated, count occurrences)
  const tagCounts: Record<string, number> = {}
  tags.forEach(t => { tagCounts[t.name] = (tagCounts[t.name] || 0) + 1 })
  const popularTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)

  // Daily bar data builder
  function dailyData(type: string) {
    const buckets: Record<string, number> = {}
    for (let d = 0; d < period; d++) {
      const key = new Date(Date.now() - d * 86400000).toISOString().slice(0, 10)
      buckets[key] = 0
    }
    events.filter(e => e.event_type === type).forEach(e => {
      const key = e.created_at.slice(0, 10)
      if (key in buckets) buckets[key]++
    })
    return Object.keys(buckets).sort().map(k => buckets[k])
  }

  const hasData = !loading && (events.length > 0 || totalBookmarks > 0)

  return (
    <div style={{ minHeight: '100vh', background: '#141414', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ width: '2rem', height: '3px', background: '#E50914', borderRadius: '2px', marginBottom: '0.6rem' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em' }}>Analytics</h1>
          <p style={{ color: '#AAAAAA', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Views, clicks, and engagement across your projects.
          </p>
        </div>

        {/* ── Filters ── */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            id="analytics-project-select"
            value={selectedProject}
            onChange={e => setSelected(e.target.value)}
            style={{
              padding: '0.5rem 0.85rem', background: '#1F1F1F',
              border: '1px solid #2B2B2B', borderRadius: '0.5rem',
              color: '#FFFFFF', fontSize: '0.875rem', outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {PERIODS.map(p => (
              <button key={p.label} id={`period-${p.label}`} onClick={() => setPeriod(p.days)} style={{
                padding: '0.45rem 0.85rem', fontSize: '0.82rem', fontWeight: period === p.days ? 700 : 400,
                background: period === p.days ? 'rgba(229,9,20,0.12)' : 'transparent',
                border: `1px solid ${period === p.days ? 'rgba(229,9,20,0.3)' : 'transparent'}`,
                color: period === p.days ? '#FFFFFF' : '#AAAAAA',
                borderRadius: '0.4rem', cursor: 'pointer',
              }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 6 Quick Stat Cards ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
          gap: '0.85rem', marginBottom: '2rem',
        }}>
          <StatCard icon={<Eye size={18} />}          label="Total Views"      value={loading ? '—' : views}    current={views}         previous={pViews}   />
          <StatCard icon={<MousePointer size={18} />} label="External Clicks"  value={loading ? '—' : clicks}   current={clicks}        previous={pClicks}  />
          <StatCard icon={<ArrowUpRight size={18} />} label="CTR"              value={loading ? '—' : `${ctr.toFixed(1)}%`} current={Math.round(ctr)} previous={Math.round(pCtr)} />
          <StatCard icon={<Bookmark size={18} />}     label="Total Bookmarks"  value={loading ? '—' : totalBookmarks} />
          <StatCard icon={<TrendingUp size={18} />}   label="Upvotes"          value={loading ? '—' : upvotes}  current={upvotes}       previous={pUpvotes} />
          <StatCard icon={<Users size={18} />}        label="Unique Visitors"  value={loading ? '—' : uniqueVisitors} current={uniqueVisitors} previous={pUnique} />
        </div>

        {/* ── Main Content: Charts + Breakdowns ── */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#555' }}>Loading analytics…</div>
        )}

        {hasData && (
          <>
            {/* ── Views + Clicks Charts ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Views over time',  type: 'view',           Chart: ViewsChart,  color: '#5B8DEF' },
                { label: 'Clicks over time', type: 'click_external', Chart: ClicksChart, color: '#E50914' },
              ].map(chart => (
                <div key={chart.type} style={{ background: '#1A1A1A', border: '1px solid #2B2B2B', borderRadius: '0.85rem', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: '#AAAAAA', margin: 0 }}>{chart.label}</h3>
                    <BarChart3 size={14} style={{ color: '#555' }} />
                  </div>
                  <chart.Chart data={dailyData(chart.type)} color={chart.color} />
                  <p style={{ fontSize: '0.7rem', color: '#444', marginTop: '0.5rem', textAlign: 'right' }}>Last {period} days</p>
                </div>
              ))}
            </div>

            {/* ── Device Breakdown + Top Tags ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Device Breakdown — SWAPPABLE sub-component */}
              <div style={{ background: '#1A1A1A', border: '1px solid #2B2B2B', borderRadius: '0.85rem', padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: '#AAAAAA', marginBottom: '1rem' }}>
                  Device Breakdown <span style={{ color: '#444', fontWeight: 400 }}>(views)</span>
                </h3>
                {devTotal === 1 && devMobile === 0 && devDesktop === 0 && devTablet === 0 ? (
                  <p style={{ color: '#555', fontSize: '0.82rem' }}>No device data yet — new view events will populate this.</p>
                ) : (
                  <DeviceBreakdown mobile={devMobile} tablet={devTablet} desktop={devDesktop} />
                )}
              </div>

              {/* Popular Tags */}
              <div style={{ background: '#1A1A1A', border: '1px solid #2B2B2B', borderRadius: '0.85rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Tag size={14} style={{ color: '#555' }} />
                  <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: '#AAAAAA', margin: 0 }}>Project Tags</h3>
                </div>
                {popularTags.length === 0 ? (
                  <p style={{ color: '#555', fontSize: '0.82rem' }}>No tags added to your projects yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {popularTags.map(([name]) => (
                      <span key={name} style={{
                        padding: '0.3rem 0.75rem', background: 'rgba(229,9,20,0.1)',
                        border: '1px solid rgba(229,9,20,0.2)', borderRadius: '9999px',
                        color: '#CCCCCC', fontSize: '0.78rem', fontWeight: 500,
                      }}>#{name}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Top Performing Projects table (only if multiple projects) ── */}
            {projects.length > 1 && (
              <div style={{ background: '#1A1A1A', border: '1px solid #2B2B2B', borderRadius: '0.85rem', padding: '1.25rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
                <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: '#AAAAAA', marginBottom: '1rem' }}>Top Performing Projects</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2B2B2B' }}>
                      {['App', 'Views', 'Clicks', 'CTR', 'Upvotes', 'Bookmarks'].map(h => (
                        <th key={h} style={{ textAlign: 'left', color: '#555', fontWeight: 600, padding: '0.5rem 0.75rem' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {perProject.map((p, i) => (
                      <tr key={p.id} style={{ borderBottom: i < perProject.length - 1 ? '1px solid #1F1F1F' : 'none' }}>
                        <td style={{ padding: '0.6rem 0.75rem', color: '#FFFFFF', fontWeight: 600 }}>{p.name}</td>
                        <td style={{ padding: '0.6rem 0.75rem', color: '#AAAAAA' }}>{p.views}</td>
                        <td style={{ padding: '0.6rem 0.75rem', color: '#AAAAAA' }}>{p.clicks}</td>
                        <td style={{ padding: '0.6rem 0.75rem', color: '#AAAAAA' }}>{p.ctr}%</td>
                        <td style={{ padding: '0.6rem 0.75rem', color: '#AAAAAA' }}>{p.upvotes}</td>
                        <td style={{ padding: '0.6rem 0.75rem', color: '#AAAAAA' }}>{p.bookmarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── AI Insight Card ── */}
            <AiInsightCard
              views={views} clicks={clicks} ctr={ctr}
              bookmarks={totalBookmarks} upvotes={upvotes}
              mobileRatio={mobileRatio} period={period}
            />
          </>
        )}

        {/* ── Empty state ── */}
        {!loading && !hasData && (
          <div style={{ background: '#1A1A1A', border: '1px solid #2B2B2B', borderRadius: '0.85rem', padding: '3rem 2rem', textAlign: 'center' }}>
            <BarChart3 size={40} style={{ color: '#333', margin: '0 auto 1rem' }} />
            <h3 style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>No data yet</h3>
            <p style={{ color: '#AAAAAA', fontSize: '0.875rem' }}>Analytics will appear once your projects receive visitors.</p>
          </div>
        )}

      </div>
    </div>
  )
}
