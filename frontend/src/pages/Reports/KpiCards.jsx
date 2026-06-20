import React, { memo } from 'react'

const ICONS = {
  openPositions:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  totalCandidates:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  activeClients:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  interviewsScheduled: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  offersReleased:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  successfulHires:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  timeToHire:          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  costPerHire:         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
}

function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null
  const max   = Math.max(...data)
  const min   = Math.min(...data)
  const range = max - min || 1
  const W = 80, H = 32
  const pts = data.map((v, i) => [
    Math.round((i / (data.length - 1)) * W),
    Math.round(H - ((v - min) / range) * (H - 6) - 3),
  ])
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ')
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="rpt-sparkline">
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const KpiCard = memo(function KpiCard({ id, card, sparkData }) {
  const isGood = card.goodDown ? card.trend < 0 : card.trend > 0
  const trendClass = isGood ? 'up' : 'down'
  const trendSign  = card.trend > 0 ? '+' : ''

  return (
    <div className="rpt-kpi-card">
      <div className="rpt-kpi-top">
        <div className="rpt-kpi-icon" style={{ background: card.bg, color: card.color }}>
          {ICONS[id]}
        </div>
        <span className={`rpt-kpi-trend ${trendClass}`}>
          {isGood
            ? <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 1 L9 7 L1 7 Z" fill="currentColor"/></svg>
            : <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 9 L9 3 L1 3 Z" fill="currentColor"/></svg>
          }
          {trendSign}{Math.abs(card.trend)}%
        </span>
      </div>
      <div className="rpt-kpi-value">{card.value}</div>
      <div className="rpt-kpi-label">{card.label}</div>
      <Sparkline data={sparkData} color={card.color} />
      <div className="rpt-kpi-compare">vs. previous month</div>
    </div>
  )
})

const SPARKS = {
  openPositions:       [2,3,2,4,3,5,4,5,4,6,5,6],
  totalCandidates:     [6,7,8,7,9,8,10,9,11,10,12,11],
  activeClients:       [8,9,9,10,10,11,10,11,12,11,12,13],
  interviewsScheduled: [4,6,5,7,6,9,8,10,9,11,10,12],
  offersReleased:      [2,3,3,4,3,5,4,6,5,7,6,8],
  successfulHires:     [1,2,2,3,3,4,4,5,5,6,6,7],
  timeToHire:          [34,32,31,30,29,30,29,28,29,28,28,27],
  costPerHire:         [52,50,49,48,47,48,47,46,46,45,46,45],
}

export default memo(function KpiCards({ kpi }) {
  return (
    <div className="rpt-kpi-grid">
      {Object.entries(kpi).map(([id, card]) => (
        <KpiCard key={id} id={id} card={card} sparkData={SPARKS[id]} />
      ))}
    </div>
  )
})
