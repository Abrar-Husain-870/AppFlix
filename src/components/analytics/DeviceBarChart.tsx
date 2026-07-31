'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

interface Props {
  mobile: number
  tablet: number
  desktop: number
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div style={{
      background: '#1A1A1A',
      border: '1px solid #2B2B2B',
      borderRadius: '0.5rem',
      padding: '0.5rem 0.75rem',
      fontSize: '0.8rem',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    }}>
      <p style={{ color: '#FFFFFF', margin: 0, fontWeight: 700 }}>
        {data.browser}: <span style={{ color: payload[0].color }}>{data.users} views</span>
      </p>
    </div>
  )
}

export default function DeviceBarChart({ mobile, tablet, desktop }: Props) {
  const chartData = [
    { browser: 'Mobile', users: mobile, color: '#E50914' },
    { browser: 'Desktop', users: desktop, color: '#5B8DEF' },
    { browser: 'Tablet', users: tablet, color: '#F59E0B' }
  ].sort((a, b) => b.users - a.users) // Sort descending so highest is on top

  return (
    <div style={{ width: '100%', height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 8, bottom: 8, left: -10 }}
        >
          <CartesianGrid
            horizontal={false}
            vertical={true}
            stroke="rgba(255, 255, 255, 0.05)"
          />
          <XAxis
            type="number"
            tick={{ fill: '#555', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <YAxis
            type="category"
            dataKey="browser"
            tick={{ fill: '#AAA', fontSize: 11, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
          <Bar
            dataKey="users"
            radius={[0, 4, 4, 0]}
            barSize={16}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
