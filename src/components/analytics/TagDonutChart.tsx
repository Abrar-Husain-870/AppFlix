'use client'

import React, { createContext, useContext, useState } from 'react'
import {
  PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts'

export interface PieDataItem {
  label: string
  value: number
}

interface PieChartContextType {
  data: PieDataItem[]
  innerRadius: number
  size: number
  activeIndex: number | null
  setActiveIndex: (index: number | null) => void
  total: number
}

const PieChartContext = createContext<PieChartContextType | null>(null)

function usePieChartContext() {
  const ctx = useContext(PieChartContext)
  if (!ctx) throw new Error('PieSlice and PieCenter must be used inside PieChart')
  return ctx
}

// Modern vibrant color palette (sleek solid fills)
const COLORS = [
  '#3B82F6', // Vibrant Electric Blue
  '#10B981', // Emerald Green
  '#E50914', // Netflix Red
  '#F59E0B', // Amber Gold
  '#8B5CF6', // Purple
  '#EC4899', // Pink
]

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div style={{
      background: '#1A1A1A',
      border: '1px solid #333333',
      borderRadius: '0.6rem',
      padding: '0.6rem 0.9rem',
      fontSize: '0.82rem',
      boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
      backdropFilter: 'blur(8px)',
    }}>
      <p style={{ color: '#FFFFFF', fontWeight: 700, marginBottom: '0.15rem' }}>#{entry.name}</p>
      <p style={{ color: '#AAAAAA' }}>{entry.value.toLocaleString()} views</p>
    </div>
  )
}

interface PieChartProps {
  data: PieDataItem[]
  innerRadius?: number
  size?: number
  children?: React.ReactNode
}

export function PieChart({ data, innerRadius = 55, size = 200, children }: PieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.value, 0)

  const rechartsData = data.map(d => ({ name: d.label, value: d.value }))

  return (
    <PieChartContext.Provider value={{ data, innerRadius, size, activeIndex, setActiveIndex, total }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
        {/* Donut Container */}
        <div style={{ width: `${size}px`, height: `${size}px`, position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={rechartsData}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={size / 2 - 14}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
                onMouseEnter={(_, i) => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {data.map((_, i) => {
                  const color = COLORS[i % COLORS.length]
                  const isActive = activeIndex === i
                  return (
                    <Cell
                      key={`cell-${i}`}
                      fill={color}
                      opacity={activeIndex !== null && !isActive ? 0.45 : 1}
                      style={{
                        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s',
                        transform: isActive ? 'scale(1.05)' : 'scale(1)',
                        transformOrigin: 'center center',
                        cursor: 'pointer',
                      }}
                    />
                  )
                })}
              </Pie>
              {children}
              <Tooltip content={<CustomTooltip />} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
          {data.map((entry, i) => {
            const color = COLORS[i % COLORS.length]
            const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0
            const isActive = activeIndex === i
            return (
              <div
                key={entry.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.35rem 0.6rem',
                  borderRadius: '0.4rem',
                  background: isActive ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                  transition: 'background 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: color,
                    flexShrink: 0,
                    boxShadow: isActive ? `0 0 10px ${color}` : 'none',
                    transition: 'box-shadow 0.2s',
                  }}
                />
                <span style={{ fontSize: '0.82rem', color: isActive ? '#FFFFFF' : '#AAAAAA', flex: 1, fontWeight: isActive ? 600 : 400, transition: 'color 0.15s' }}>
                  #{entry.label}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#777777', fontVariantNumeric: 'tabular-nums' }}>
                  {entry.value.toLocaleString()} <span style={{ color: '#555555' }}>({pct}%)</span>
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </PieChartContext.Provider>
  )
}

interface PieSliceProps {
  index: number
  hoverEffect?: 'grow' | 'fade' | 'none'
}

export function PieSlice({ index, hoverEffect = 'grow' }: PieSliceProps) {
  return null
}

interface PieCenterProps {
  defaultLabel?: string
}

export function PieCenter({ defaultLabel = 'Total' }: PieCenterProps) {
  const { total } = usePieChartContext()
  return (
    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
      <tspan x="50%" dy="-6" fill="#FFFFFF" fontSize="1.2rem" fontWeight="800">
        {total.toLocaleString()}
      </tspan>
      <tspan x="50%" dy="18" fill="#777777" fontSize="0.65rem" letterSpacing="0.08em" style={{ textTransform: 'uppercase' }}>
        {defaultLabel.toUpperCase()}
      </tspan>
    </text>
  )
}

interface TagDonutChartProps {
  data: { name: string; value: number }[]
}

export default function TagDonutChart({ data }: TagDonutChartProps) {
  const top4 = data.slice(0, 4)
  const rest = data.slice(4)
  const chartData = rest.length > 0
    ? [...top4, { name: 'other', value: rest.reduce((s, d) => s + d.value, 0) }]
    : top4

  const pieData: PieDataItem[] = chartData.map(d => ({
    label: d.name,
    value: d.value,
  }))

  const total = pieData.reduce((s, d) => s + d.value, 0)

  if (total === 0) {
    return (
      <p style={{ color: '#555', fontSize: '0.82rem', textAlign: 'center', padding: '2rem 0' }}>
        No views recorded for tagged projects yet.
      </p>
    )
  }

  return (
    <PieChart data={pieData} innerRadius={55} size={200}>
      {pieData.map((item, index) => (
        <PieSlice hoverEffect="grow" index={index} key={item.label} />
      ))}
      <PieCenter defaultLabel="Tag Views" />
    </PieChart>
  )
}
