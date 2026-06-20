import React, { memo } from 'react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useChartColors } from '../../hooks/useChartColors'

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rpt-tooltip">
      <p className="rpt-tt-label">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  )
}

const RecruitmentFunnel = memo(function RecruitmentFunnel({ funnelData }) {
  const maxCount = funnelData[0]?.count || 1
  return (
    <div className="rpt-funnel">
      {funnelData.map((stage, i) => {
        const widthPct = Math.max((stage.count / maxCount) * 100, 15)
        return (
          <div key={stage.label} className="rpt-funnel-row">
            <span className="rpt-funnel-label">{stage.label}</span>
            <div className="rpt-funnel-bar-wrap">
              <div
                className="rpt-funnel-bar"
                style={{ width: `${widthPct}%`, background: stage.color }}
              >
                <span className="rpt-funnel-count">{stage.count}</span>
              </div>
            </div>
            <div className="rpt-funnel-stats">
              <span className="rpt-funnel-pct">{stage.conversion}%</span>
              {i > 0 && <span className="rpt-funnel-drop">-{stage.dropOff}%</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
})

const MonthlyTrendChart = memo(function MonthlyTrendChart({ data }) {
  const colors = useChartColors()
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradInterviews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradOffers" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradHires" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#F97316" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: colors.tick }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: colors.tick }} tickLine={false} axisLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="interviews" name="Interviews" stroke="#6366F1" strokeWidth={2} fill="url(#gradInterviews)" />
        <Area type="monotone" dataKey="offers"     name="Offers"     stroke="#22C55E" strokeWidth={2} fill="url(#gradOffers)" />
        <Area type="monotone" dataKey="hires"      name="Hires"      stroke="#F97316" strokeWidth={2} fill="url(#gradHires)" />
      </AreaChart>
    </ResponsiveContainer>
  )
})

const WeeklyActivityChart = memo(function WeeklyActivityChart({ data }) {
  const colors = useChartColors()
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barGap={4} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
        <XAxis dataKey="week" tick={{ fontSize: 11, fill: colors.tick }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: colors.tick }} tickLine={false} axisLine={false} />
        <Tooltip content={<ChartTooltip />} />
        <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="applications" name="Applications" fill="#6366F1" radius={[3, 3, 0, 0]} />
        <Bar dataKey="interviews"   name="Interviews"   fill="#8B5CF6" radius={[3, 3, 0, 0]} />
        <Bar dataKey="offers"       name="Offers"       fill="#22C55E" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
})

export default memo(function FunnelAndTrends({ funnelData, monthlyTrend, weeklyActivity }) {
  return (
    <>
      {/* Row: Funnel + Monthly Trend */}
      <div className="rpt-row rpt-row-funnel">
        <div className="rpt-card">
          <div className="rpt-card-head">
            <div>
              <div className="rpt-card-title">Recruitment Funnel</div>
              <div className="rpt-card-sub">Stage-wise conversion analysis</div>
            </div>
          </div>
          <div className="rpt-card-body">
            <RecruitmentFunnel funnelData={funnelData} />
          </div>
        </div>
        <div className="rpt-card">
          <div className="rpt-card-head">
            <div>
              <div className="rpt-card-title">Monthly Hiring Trend</div>
              <div className="rpt-card-sub">Interviews · Offers · Hires</div>
            </div>
          </div>
          <div className="rpt-card-body">
            <MonthlyTrendChart data={monthlyTrend} />
          </div>
        </div>
      </div>

      {/* Row: Weekly Activity */}
      <div className="rpt-card">
        <div className="rpt-card-head">
          <div>
            <div className="rpt-card-title">Weekly Recruitment Activity</div>
            <div className="rpt-card-sub">Applications · Interviews · Offers per week</div>
          </div>
        </div>
        <div className="rpt-card-body rpt-card-body-chart">
          <WeeklyActivityChart data={weeklyActivity} />
        </div>
      </div>
    </>
  )
})
