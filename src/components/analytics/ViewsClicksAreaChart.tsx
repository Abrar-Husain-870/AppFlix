'use client'

/**
 * ViewsClicksAreaChart
 *
 * A dual-area chart showing Views and External Clicks over time on the same
 * graph — built with Recharts in the AppFlix / Netflix dark color theme.
 *
 * Uses `type="monotone"` curve (same algorithm as @visx/curve curveMonotoneX).
 *
 * Props:
 *   data — array of { date: string (YYYY-MM-DD), views: number, clicks: number }
 *   period — number of days (used for X-axis label density)
 */

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface DataPoint {
  date: string   // "YYYY-MM-DD"
  views: number
  clicks: number
}

interface Props {
  data: DataPoint[]
  period: number
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1A1A1A',
      border: '1px solid #2B2B2B',
      borderRadius: '0.5rem',
      padding: '0.65rem 0.9rem',
      fontSize: '0.8rem',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    }}>
      <p style={{ color: '#888', marginBottom: '0.35rem', fontWeight: 600 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color, margin: '0.15rem 0', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontWeight: 700 }}>{p.value}</span>
          <span style={{ color: '#666' }}>{p.name}</span>
        </p>
      ))}
    </div>
  )
}

// ─── Custom Legend ────────────────────────────────────────────────────────────
function CustomLegend() {
  return (
    <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
      {[
        { color: '#5B8DEF', label: 'Views' },
        { color: '#E50914', label: 'Clicks' },
      ].map(({ color, label }) => (
        <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#AAAAAA' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, display: 'inline-block' }} />
          {label}
        </span>
      ))}
    </div>
  )
}

// ─── X-axis label formatter ───────────────────────────────────────────────────
function formatDate(dateStr: string, period: number): string {
  const d = new Date(dateStr)
  if (period <= 7) return d.toLocaleDateString('en-US', { weekday: 'short' })
  if (period <= 30) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ViewsClicksAreaChart({ data, period }: Props) {
  if (!data || data.length === 0) {
    return (
      <p style={{ color: '#555', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>
        No data for this period yet.
      </p>
    )
  }

  // Show fewer X-axis ticks for longer periods
  const tickInterval = period <= 7 ? 0 : period <= 30 ? 4 : 9

  return (
    <div>
      <CustomLegend />
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <defs>
            {/* Views gradient — Netflix blue */}
            <linearGradient id="gradViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#5B8DEF" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#5B8DEF" stopOpacity={0.02} />
            </linearGradient>
            {/* Clicks gradient — Netflix red */}
            <linearGradient id="gradClicks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#E50914" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#E50914" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />

          <XAxis
            dataKey="date"
            tickFormatter={(v) => formatDate(v, period)}
            interval={tickInterval}
            tick={{ fill: '#555', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{ fill: '#444', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Views area — behind clicks */}
          <Area
            type="monotone"
            dataKey="views"
            name="Views"
            stroke="#5B8DEF"
            strokeWidth={2}
            fill="url(#gradViews)"
            dot={false}
            activeDot={{ r: 4, fill: '#5B8DEF', stroke: '#141414', strokeWidth: 2 }}
          />

          {/* Clicks area — on top */}
          <Area
            type="monotone"
            dataKey="clicks"
            name="Clicks"
            stroke="#E50914"
            strokeWidth={2}
            fill="url(#gradClicks)"
            dot={false}
            activeDot={{ r: 4, fill: '#E50914', stroke: '#141414', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
