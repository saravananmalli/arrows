import React, { memo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const DonutTooltip = memo(function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="donut-tooltip">
      <div className="donut-tooltip-label" style={{ color: item.color }}>{item.label}</div>
      <div className="donut-tooltip-value">{item.value}</div>
    </div>
  )
})

export default function RecruitmentStatus({ data }) {
  if (!data) return null

  return (
    <div className="recruit-card">
      <div className="card-header">
        <h2 className="card-title">Recruitment Status</h2>
        <span className="week-badge">
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="16" height="14" rx="2"/>
            <path d="M6 2v4M14 2v4M2 9h16"/>
          </svg>
          {data.period}
        </span>
      </div>

      {/* Donut chart */}
      <div className="recruit-donut-wrap">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data.breakdown}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={2}
              strokeWidth={0}
            >
              {(data.breakdown ?? []).map((seg, i) => (
                <Cell key={i} fill={seg.color} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="recruit-donut-center">
          <div className="recruit-donut-total-label">Total</div>
          <div className="recruit-donut-total-value">{data.total}</div>
        </div>
      </div>

      {/* Legend grid */}
      <div className="recruit-legend">
        {(data.breakdown ?? []).map(item => (
          <div key={item.label} className="recruit-legend-item">
            <span className="recruit-legend-dot" style={{ background: item.color }} />
            <span className="recruit-legend-label">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="recruit-divider" />

      {/* Top performer */}
      <div className="performer-section">
        <div className="performer-row-label">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 1l2.39 4.84 5.34.78-3.86 3.76.91 5.32L10 13.27l-4.78 2.53.91-5.32L2.27 6.62l5.34-.78L10 1z"/>
          </svg>
          Top Performer
        </div>
        <div className="performer-card">
          <div className="performer-avatar">
            {data.topPerformer.initials}
          </div>
          <div className="performer-info">
            <div className="performer-name">{data.topPerformer.name}</div>
            <div className="performer-role">{data.topPerformer.role}</div>
          </div>
          <div className="performer-right">
            <div className="performer-perf-label">Performance</div>
            <div className="performer-perf-value">{data.topPerformer.performance}%</div>
          </div>
        </div>
        <div className="view-all-row">
          <span className="view-all-link">View all</span>
        </div>
      </div>
    </div>
  )
}
