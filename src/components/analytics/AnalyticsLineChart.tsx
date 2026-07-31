'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

interface Props {
  data: any[]
  period: number
  dataKey: 'views' | 'clicks'
  strokeColor: string
  label: string
}

function CustomTooltip({ active, payload, label, strokeColor, labelText }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#1A1A1A',
      border: '1px solid #2B2B2B',
      borderRadius: '0.5rem',
      padding: '0.5rem 0.75rem',
      fontSize: '0.8rem',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    }}>
      <p style={{ color: '#888', margin: '0 0 0.25rem', fontWeight: 600 }}>{label}</p>
      <p style={{ color: strokeColor, margin: 0, fontWeight: 700 }}>
        {payload[0].value} {labelText.toLowerCase()}
      </p>
    </div>
  )
}

function formatDate(dateStr: string, period: number): string {
  const d = new Date(dateStr)
  if (period <= 7) return d.toLocaleDateString('en-US', { weekday: 'short' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function AnalyticsLineChart({ data, period, dataKey, strokeColor, label }: Props) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const minDate = data[0]?.date || ''
  const maxDate = data[data.length - 1]?.date || ''

  useEffect(() => {
    if (minDate && maxDate) {
      setStartDate(minDate)
      setEndDate(maxDate)
    }
  }, [minDate, maxDate])

  if (!data || data.length === 0) {
    return (
      <p style={{ color: '#555', fontSize: '0.82rem', textAlign: 'center', padding: '1.5rem 0' }}>
        No data yet.
      </p>
    )
  }

  const filteredData = data.filter(d => {
    if (!startDate || !endDate) return true
    return d.date >= startDate && d.date <= endDate
  })

  const count = filteredData.length
  const tickInterval = count <= 7 ? 0 : count <= 30 ? 5 : 10

  return (
    <div>
      {/* Date Pickers Filter Row */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        paddingBottom: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#777777', fontWeight: 500 }}>From</span>
          <input
            type="date"
            value={startDate}
            min={minDate}
            max={maxDate}
            onChange={e => setStartDate(e.target.value)}
            style={{
              background: '#222',
              border: '1px solid #333',
              borderRadius: '0.4rem',
              padding: '0.2rem 0.45rem',
              color: '#FFF',
              fontSize: '0.72rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#777777', fontWeight: 500 }}>To</span>
          <input
            type="date"
            value={endDate}
            min={minDate}
            max={maxDate}
            onChange={e => setEndDate(e.target.value)}
            style={{
              background: '#222',
              border: '1px solid #333',
              borderRadius: '0.4rem',
              padding: '0.2rem 0.45rem',
              color: '#FFF',
              fontSize: '0.72rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          />
        </div>
      </div>

      <div style={{ width: '100%', height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={filteredData}
            margin={{ top: 8, right: 8, bottom: 0, left: -28 }}
          >
            <CartesianGrid
              horizontal={true}
              vertical={false}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeDasharray="3 3"
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
            <Tooltip content={<CustomTooltip strokeColor={strokeColor} labelText={label} />} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={strokeColor}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: strokeColor, stroke: '#141414', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
