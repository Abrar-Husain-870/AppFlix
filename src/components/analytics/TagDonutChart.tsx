'use client'

import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector,
} from 'recharts'
import { useState } from 'react'

interface Props {
  data: { name: string; value: number }[]
}

// Four distinct patterns matching the snippet's orientations
const PATTERNS = [
  { id: 'dp-1', color: 'hsl(221,83%,64%)',  type: 'diagonal' },
  { id: 'dp-2', color: 'hsl(142,71%,45%)',  type: 'horizontal' },
  { id: 'dp-3', color: 'hsl(355,78%,55%)',  type: 'vertical' },
  { id: 'dp-4', color: 'hsl(43,96%,56%)',   type: 'diagonalRTL' },
]

function PatternDefs() {
  return (
    <defs>
      {/* dp-1 diagonal */}
      <pattern id="dp-1" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="6" stroke="hsl(221,83%,64%)" strokeWidth="2" />
      </pattern>

      {/* dp-2 horizontal */}
      <pattern id="dp-2" width="6" height="6" patternUnits="userSpaceOnUse">
        <line x1="0" y1="3" x2="6" y2="3" stroke="hsl(142,71%,45%)" strokeWidth="2" />
      </pattern>

      {/* dp-3 vertical */}
      <pattern id="dp-3" width="6" height="6" patternUnits="userSpaceOnUse">
        <line x1="3" y1="0" x2="3" y2="6" stroke="hsl(355,78%,55%)" strokeWidth="2" />
      </pattern>

      {/* dp-4 diagonal right-to-left */}
      <pattern id="dp-4" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
        <line x1="0" y1="0" x2="0" y2="8" stroke="hsl(43,96%,56%)" strokeWidth="2" />
      </pattern>

      {/* Solid bg fills beneath each pattern so the slice has colour */}
      <pattern id="dp-1-bg" width="1" height="1" patternUnits="objectBoundingBox">
        <rect width="1" height="1" fill="hsl(221,83%,64%,0.18)" />
      </pattern>
      <pattern id="dp-2-bg" width="1" height="1" patternUnits="objectBoundingBox">
        <rect width="1" height="1" fill="hsl(142,71%,45%,0.18)" />
      </pattern>
      <pattern id="dp-3-bg" width="1" height="1" patternUnits="objectBoundingBox">
        <rect width="1" height="1" fill="hsl(355,78%,55%,0.18)" />
      </pattern>
      <pattern id="dp-4-bg" width="1" height="1" patternUnits="objectBoundingBox">
        <rect width="1" height="1" fill="hsl(43,96%,56%,0.18)" />
      </pattern>
    </defs>
  )
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div style={{
      background: '#1A1A1A', border: '1px solid #2B2B2B',
      borderRadius: '0.5rem', padding: '0.5rem 0.85rem',
      fontSize: '0.8rem', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    }}>
      <p style={{ color: '#FFFFFF', fontWeight: 700, marginBottom: '0.1rem' }}>#{entry.name}</p>
      <p style={{ color: '#AAAAAA' }}>{entry.value.toLocaleString()} views</p>
    </div>
  )
}

// Center label rendered via SVG foreignObject
function CenterLabel({ total }: { total: number }) {
  return (
    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
      <tspan x="50%" dy="-8" style={{ fontSize: '1.3rem', fontWeight: 800, fill: '#FFFFFF' }}>
        {total.toLocaleString()}
      </tspan>
      <tspan x="50%" dy="20" style={{ fontSize: '0.68rem', fill: '#666', letterSpacing: '0.06em' }}>
        TOTAL
      </tspan>
    </text>
  )
}

export default function TagDonutChart({ data }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  // Cap to 4 slices (one per pattern); group remainder into "Other"
  const top4 = data.slice(0, 4)
  const rest = data.slice(4)
  const chartData = rest.length > 0
    ? [...top4, { name: 'other', value: rest.reduce((s, d) => s + d.value, 0) }]
    : top4

  const total = chartData.reduce((s, d) => s + d.value, 0)

  if (total === 0) {
    return (
      <p style={{ color: '#555', fontSize: '0.82rem', textAlign: 'center', padding: '2rem 0' }}>
        No views recorded for tagged projects yet.
      </p>
    )
  }

  const patternIds = ['dp-1', 'dp-2', 'dp-3', 'dp-4']
  const strokeColors = [
    'hsl(221,83%,64%)', 'hsl(142,71%,45%)', 'hsl(355,78%,55%)', 'hsl(43,96%,56%)'
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
      {/* Donut */}
      <div style={{ width: '200px', height: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <PatternDefs />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              onMouseEnter={(_, i) => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {chartData.map((_, i) => {
                const pid = patternIds[i % patternIds.length]
                const sc  = strokeColors[i % strokeColors.length]
                const isActive = activeIndex === i
                return (
                  <Cell
                    key={`cell-${i}`}
                    fill={`url(#${pid})`}
                    stroke={sc}
                    strokeWidth={isActive ? 2 : 1}
                    opacity={activeIndex !== null && !isActive ? 0.5 : 1}
                    style={{ transition: 'opacity 0.2s' }}
                  />
                )
              })}
            </Pie>

            {/* Center label as SVG */}
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
              <tspan x="50%" dy="-8" fill="#FFFFFF" fontSize="1.15rem" fontWeight="800">
                {total.toLocaleString()}
              </tspan>
              <tspan x="50%" dy="18" fill="#666" fontSize="0.65rem" letterSpacing="0.06em">
                TOTAL VIEWS
              </tspan>
            </text>

            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
        {chartData.map((entry, i) => {
          const sc = strokeColors[i % strokeColors.length]
          const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0
          return (
            <div key={entry.name}
              style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'default' }}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {/* Pattern swatch */}
              <svg width="16" height="16" style={{ flexShrink: 0, borderRadius: '3px', border: `1.5px solid ${sc}` }}>
                <rect width="16" height="16" fill={`url(#${patternIds[i % patternIds.length]})`} opacity="0.85" />
              </svg>
              <span style={{ fontSize: '0.78rem', color: activeIndex === i ? '#FFFFFF' : '#AAAAAA', flex: 1, transition: 'color 0.15s' }}>
                #{entry.name}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#666', fontVariantNumeric: 'tabular-nums' }}>
                {entry.value.toLocaleString()} <span style={{ color: '#444' }}>({pct}%)</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
