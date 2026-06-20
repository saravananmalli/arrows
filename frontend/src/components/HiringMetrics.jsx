import React, { memo, useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { useChartColors } from '../hooks/useChartColors'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const CustomTooltip = memo(function CustomTooltip({ active, payload, label, colors }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: colors.cardBg, border: `1px solid ${colors.border}`,
      borderRadius: 8, padding: '10px 14px', fontSize: 12,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: colors.text }}>{label}</div>
      <div style={{ color: colors.textMuted, marginBottom: 3 }}>
        No of openings : <strong style={{ color: colors.text }}>{payload[0]?.payload?.openings}</strong>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: colors.textMuted }}>
        <span style={{ width: 10, height: 10, borderRadius: 2, background: colors.primary, display: 'inline-block' }}/>
        Selected : <strong style={{ color: colors.text }}>{payload[0]?.payload?.selected}</strong>
      </div>
    </div>
  )
})

const HiringMetrics = memo(function HiringMetrics({ data }) {
  const [selectedMonth, setSelectedMonth] = useState(data?.selectedMonth || 'Apr')
  const colors = useChartColors()

  const chartData = useMemo(() => data?.data ?? [], [data])

  if (!data) return null

  return (
    <div className="metrics-card">
      <div className="metrics-header">
        <h2 className="card-title">Hiring Metrics</h2>
        <select
          className="metrics-month-select"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
        >
          {MONTHS.map(m => <option key={m}>{m}</option>)}
        </select>
      </div>

      <div className="chart-area">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="40%" margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={colors.grid} />
            <XAxis
              dataKey="month" axisLine={false} tickLine={false}
              tick={{ fontSize: 11, fill: colors.tick }}
            />
            <YAxis
              axisLine={false} tickLine={false}
              tick={{ fontSize: 11, fill: colors.tick }}
              ticks={[0, 50, 100, 200, 400, 600, 800, 1000]} domain={[0, 1000]}
            />
            <Tooltip content={<CustomTooltip colors={colors} />} cursor={{ fill: 'rgba(128,128,128,0.08)' }} />
            <Bar dataKey="openings" radius={[4, 4, 0, 0]}>
              {chartData.map(entry => (
                <Cell
                  key={entry.month}
                  fill={entry.month === selectedMonth ? colors.barActive : colors.barInactive}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-legend">
        <div className="chart-legend-item">
          <span className="legend-swatch" style={{ background: 'transparent', border: `1.5px solid ${colors.tick}` }} />
          No of openings
        </div>
        <div className="chart-legend-item">
          <span className="legend-swatch" style={{ background: colors.barActive }} />
          Completed
        </div>
      </div>
    </div>
  )
})

export default HiringMetrics
