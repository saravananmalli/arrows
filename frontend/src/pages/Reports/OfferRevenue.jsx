import React, { memo } from 'react'
import {
  PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useChartColors } from '../../hooks/useChartColors'

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rpt-tooltip">
      {label && <p className="rpt-tt-label">{label}</p>}
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color || p.payload.color }}>
          {p.name}: <strong>{typeof p.value === 'number' && p.name !== 'Accepted' && p.name !== 'Rejected'
            ? `₹${(p.value / 1000).toFixed(0)}K`
            : p.value}</strong>
        </p>
      ))}
    </div>
  )
}

const OfferDonut = memo(function OfferDonut({ offerStats }) {
  const { released, accepted, rejected, acceptanceRate, joiningRatio, chartData } = offerStats
  return (
    <div className="rpt-card">
      <div className="rpt-card-head">
        <div className="rpt-card-title">Offer Analytics</div>
        <div className="rpt-card-sub">Acceptance and joining rates</div>
      </div>
      <div className="rpt-card-body">
        <div className="rpt-offer-wrap">
          <div className="rpt-offer-chart">
            <PieChart width={160} height={160}>
              <Pie
                data={chartData}
                cx={75}
                cy={75}
                innerRadius={48}
                outerRadius={72}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map(entry => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
            <div className="rpt-donut-center">
              <span className="rpt-donut-pct">{acceptanceRate}%</span>
              <span className="rpt-donut-sub">accepted</span>
            </div>
          </div>
          <div className="rpt-offer-stats">
            <div className="rpt-offer-stat">
              <span className="label">Offers Released</span>
              <span className="value">{released}</span>
            </div>
            <div className="rpt-offer-stat">
              <span className="label">Accepted</span>
              <span className="value" style={{ color: '#22C55E' }}>{accepted}</span>
            </div>
            <div className="rpt-offer-stat">
              <span className="label">Rejected</span>
              <span className="value" style={{ color: '#EF4444' }}>{rejected}</span>
            </div>
            <div className="rpt-offer-stat">
              <span className="label">Joining Ratio</span>
              <span className="value" style={{ color: '#6366F1' }}>{joiningRatio}%</span>
            </div>
          </div>
        </div>
        <div className="rpt-legend" style={{ marginTop: 16 }}>
          {chartData.map(d => (
            <div key={d.name} className="rpt-legend-item">
              <span className="dot" style={{ background: d.color }} />
              <span>{d.name}</span>
              <strong>{d.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

const RevenueCharts = memo(function RevenueCharts({ revenueByClient, monthlyRevenue }) {
  const colors = useChartColors()
  return (
    <div className="rpt-card">
      <div className="rpt-card-head">
        <div className="rpt-card-title">Revenue Analytics</div>
        <div className="rpt-card-sub">Monthly trend and client breakdown</div>
      </div>
      <div className="rpt-card-body">
        <div className="rpt-rev-label">Monthly Revenue Trend</div>
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={monthlyRevenue} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: colors.tick }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: colors.tick }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366F1" strokeWidth={2} fill="url(#gradRev)" />
          </AreaChart>
        </ResponsiveContainer>

        <div className="rpt-rev-label" style={{ marginTop: 16 }}>Revenue by Client</div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={revenueByClient} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: colors.tick }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: colors.tick }} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="revenue" name="Revenue" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})

export default memo(function OfferRevenue({ offerStats, revenueByClient, monthlyRevenue }) {
  return (
    <div className="rpt-row">
      <OfferDonut offerStats={offerStats} />
      <RevenueCharts revenueByClient={revenueByClient} monthlyRevenue={monthlyRevenue} />
    </div>
  )
})
