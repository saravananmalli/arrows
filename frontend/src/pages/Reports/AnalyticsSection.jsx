import React, { memo } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useChartColors } from '../../hooks/useChartColors'

const PIE_COLORS = ['#6366F1','#8B5CF6','#0EA5E9','#22C55E','#F97316','#EAB308']

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="rpt-tooltip">
      <p style={{ color: p.payload.color || p.color }}>{p.name}: <strong>{p.value}</strong></p>
    </div>
  )
}

const SourceChart = memo(function SourceChart({ data }) {
  return (
    <div className="rpt-card">
      <div className="rpt-card-head">
        <div className="rpt-card-title">Candidate Sources</div>
        <div className="rpt-card-sub">Where candidates come from</div>
      </div>
      <div className="rpt-card-body rpt-source-body">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="rpt-legend">
          {data.map((entry, i) => (
            <div key={entry.name} className="rpt-legend-item">
              <span className="dot" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
              <span>{entry.name}</span>
              <strong>{entry.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

const ExperienceChart = memo(function ExperienceChart({ data }) {
  const colors = useChartColors()
  return (
    <div className="rpt-card">
      <div className="rpt-card-head">
        <div className="rpt-card-title">Experience Distribution</div>
        <div className="rpt-card-sub">Candidates by years of experience</div>
      </div>
      <div className="rpt-card-body">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: colors.tick }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: colors.tick }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="value" name="Candidates" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})

const SkillDemandChart = memo(function SkillDemandChart({ data }) {
  const colors = useChartColors()
  return (
    <div className="rpt-card">
      <div className="rpt-card-head">
        <div className="rpt-card-title">Skill Demand Report</div>
        <div className="rpt-card-sub">Top in-demand technical skills</div>
      </div>
      <div className="rpt-card-body">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 20, left: 60, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: colors.tick }} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: colors.tick }} tickLine={false} axisLine={false} width={58} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="value" name="Demand" fill="#6366F1" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})

const InterviewAnalytics = memo(function InterviewAnalytics({ interviewStats }) {
  const { scheduled, completed, cancelled, offerRatio, roundData } = interviewStats
  const colors = useChartColors()
  return (
    <div className="rpt-card">
      <div className="rpt-card-head">
        <div className="rpt-card-title">Interview Analytics</div>
        <div className="rpt-card-sub">Breakdown by stage and round</div>
      </div>
      <div className="rpt-card-body">
        <div className="rpt-stat-grid">
          <div className="rpt-stat-mini rpt-stat-mini--violet">
            <div className="label">Scheduled</div>
            <div className="value">{scheduled}</div>
          </div>
          <div className="rpt-stat-mini rpt-stat-mini--green">
            <div className="label">Completed</div>
            <div className="value">{completed}</div>
          </div>
          <div className="rpt-stat-mini rpt-stat-mini--red">
            <div className="label">Cancelled</div>
            <div className="value">{cancelled}</div>
          </div>
          <div className="rpt-stat-mini rpt-stat-mini--orange">
            <div className="label">Offer Ratio</div>
            <div className="value">{offerRatio}%</div>
          </div>
        </div>
        <div className="rpt-round-chart">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={roundData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
              <XAxis dataKey="round" tick={{ fontSize: 10, fill: colors.tick }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: colors.tick }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="scheduled" name="Scheduled" fill="#6366F1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="completed" name="Completed"  fill="#22C55E" radius={[3, 3, 0, 0]} />
              <Bar dataKey="cancelled" name="Cancelled"  fill="#EF4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
})

export default memo(function AnalyticsSection({ candidateSources, experienceDist, skillDemand, interviewStats }) {
  return (
    <>
      <div className="rpt-row">
        <SourceChart data={candidateSources} />
        <ExperienceChart data={experienceDist} />
      </div>
      <div className="rpt-row">
        <SkillDemandChart data={skillDemand} />
        <InterviewAnalytics interviewStats={interviewStats} />
      </div>
    </>
  )
})
