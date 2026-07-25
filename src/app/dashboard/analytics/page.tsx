'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, Eye, TrendingUp, MousePointer, ArrowUpRight } from 'lucide-react'

interface Project { id: string; name: string; upvote_count: number }
interface EventRow { event_type: string; created_at: string }

const PERIODS = [
  { label: '7d',  days: 7  },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number | string; sub?: string }) {
  return (
    <div style={{
      background: '#1F1F1F', border: '1px solid #2B2B2B', borderRadius: '0.75rem', padding: '1.25rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <span style={{ color: '#555' }}>{icon}</span>
        {sub && <span style={{ fontSize: '0.72rem', color: '#2ECC71', background: 'rgba(46,204,113,0.1)', padding: '0.15rem 0.45rem', borderRadius: '9999px' }}>{sub}</span>}
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: '#AAAAAA', marginTop: '0.3rem' }}>{label}</div>
    </div>
  )
}

function SimpleChart({ data, color = '#E50914' }: { data: number[]; color?: string }) {
  if (!data.length) return null
  const max = Math.max(...data, 1)
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '60px' }}>
      {data.map((v, i) => (
        <div key={i} title={String(v)} style={{
          flex: 1, minWidth: '6px',
          height: `${Math.max((v / max) * 100, 2)}%`,
          background: v > 0 ? color : '#262626',
          borderRadius: '2px 2px 0 0',
          transition: 'height 0.3s',
          opacity: i === data.length - 1 ? 1 : 0.6 + (i / data.length) * 0.4,
        }} />
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [period, setPeriod] = useState(30)
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { window.location.href = '/login'; return }
      const { data: projs } = await supabase
        .from('projects')
        .select('id, name, upvote_count')
        .eq('user_id', data.user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
      setProjects((projs as Project[]) ?? [])
    })
  }, [])

  useEffect(() => {
    if (!projects.length) return
    setLoading(true)
    const supabase = createClient()
    const since = new Date(Date.now() - period * 86400000).toISOString()

    let query = supabase
      .from('analytics_events')
      .select('event_type, created_at')
      .gte('created_at', since)

    if (selectedProject !== 'all') {
      query = query.eq('project_id', selectedProject)
    } else if (projects.length > 0) {
      query = query.in('project_id', projects.map(p => p.id))
    }

    query.then(({ data }) => {
      setEvents(data ?? [])
      setLoading(false)
    })
  }, [projects, selectedProject, period])

  const eventUpvotes = events.filter(e => e.event_type === 'upvote').length
  const totalDbUpvotes = selectedProject === 'all'
    ? projects.reduce((acc, p) => acc + (p.upvote_count || 0), 0)
    : (projects.find(p => p.id === selectedProject)?.upvote_count || 0)

  const counts = {
    views:   events.filter(e => e.event_type === 'view').length,
    clicks:  events.filter(e => e.event_type === 'click_external').length,
    upvotes: Math.max(eventUpvotes, totalDbUpvotes),
  }
  const ctr = counts.views > 0 ? ((counts.clicks / counts.views) * 100).toFixed(1) : '0.0'

  // Build daily bar data
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

  return (
    <div style={{ minHeight: '100vh', background: '#141414', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="accent-line" style={{ width: '2rem', marginBottom: '0.5rem' }} />
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.03em' }}>Analytics</h1>
          <p style={{ color: '#AAAAAA', fontSize: '0.875rem', marginTop: '0.25rem' }}>Views, clicks, and engagement across your projects.</p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            id="analytics-project-select"
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
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

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <StatCard icon={<Eye size={18} />}          label="Total Views"    value={loading ? '—' : counts.views} />
          <StatCard icon={<MousePointer size={18} />} label="External Clicks" value={loading ? '—' : counts.clicks} />
          <StatCard icon={<TrendingUp size={18} />}   label="Upvotes"        value={loading ? '—' : counts.upvotes} />
          <StatCard icon={<ArrowUpRight size={18} />} label="Click-Through Rate" value={loading ? '—' : `${ctr}%`} sub={counts.views > 0 ? 'live' : undefined} />
        </div>

        {/* Charts */}
        {!loading && events.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { label: 'Views over time',   type: 'view',           color: '#5B8DEF' },
              { label: 'Clicks over time',  type: 'click_external', color: '#E50914' },
            ].map(chart => (
              <div key={chart.type} style={{
                background: '#1F1F1F', border: '1px solid #2B2B2B', borderRadius: '0.75rem', padding: '1.25rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: '#AAAAAA' }}>{chart.label}</h3>
                  <BarChart3 size={14} style={{ color: '#555' }} />
                </div>
                <SimpleChart data={dailyData(chart.type)} color={chart.color} />
                <p style={{ fontSize: '0.72rem', color: '#555', marginTop: '0.5rem', textAlign: 'right' }}>
                  Last {period} days
                </p>
              </div>
            ))}
          </div>
        )}

        {!loading && events.length === 0 && (
          <div style={{
            background: '#1F1F1F', border: '1px solid #2B2B2B', borderRadius: '0.75rem',
            padding: '3rem 2rem', textAlign: 'center',
          }}>
            <BarChart3 size={40} style={{ color: '#333', margin: '0 auto 1rem' }} />
            <h3 style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>No data yet</h3>
            <p style={{ color: '#AAAAAA', fontSize: '0.875rem' }}>Analytics will appear once your projects receive visitors.</p>
          </div>
        )}
      </div>
    </div>
  )
}
