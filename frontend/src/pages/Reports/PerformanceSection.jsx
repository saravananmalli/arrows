import React, { memo } from 'react'

const RANK_CLASS = ['gold', 'silver', 'bronze', '', '']

function RankBadge({ rank }) {
  return (
    <span className={`rpt-rank ${RANK_CLASS[rank] || ''}`}>{rank + 1}</span>
  )
}

function SuccessBar({ value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="rpt-progress-bar">
      <div className="rpt-progress-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}

const RecruiterLeaderboard = memo(function RecruiterLeaderboard({ recruiterPerf }) {
  const maxSourced = Math.max(...recruiterPerf.map(r => r.sourced), 1)
  return (
    <div className="rpt-card">
      <div className="rpt-card-head">
        <div>
          <div className="rpt-card-title">Recruiter Performance</div>
          <div className="rpt-card-sub">Leaderboard by candidates sourced</div>
        </div>
      </div>
      <div className="rpt-card-body rpt-card-body-table">
        {recruiterPerf.length === 0 ? (
          <p className="rpt-empty">No recruiter data available.</p>
        ) : (
          <table className="rpt-perf-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Recruiter</th>
                <th>Sourced</th>
                <th>Interviews</th>
                <th>Offers</th>
                <th>Hires</th>
                <th>Success %</th>
              </tr>
            </thead>
            <tbody>
              {recruiterPerf.map((r, i) => (
                <tr key={r.name}>
                  <td><RankBadge rank={i} /></td>
                  <td className="rpt-recruiter-name">{r.name}</td>
                  <td>
                    <span className="rpt-perf-num">{r.sourced}</span>
                    <SuccessBar value={r.sourced} max={maxSourced} />
                  </td>
                  <td>{r.interviews}</td>
                  <td>{r.offers}</td>
                  <td><strong>{r.hires}</strong></td>
                  <td>
                    <span className={`rpt-ratio ${r.successRatio >= 50 ? 'good' : 'mid'}`}>
                      {r.successRatio}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
})

const ClientPerformance = memo(function ClientPerformance({ clientPerf }) {
  return (
    <div className="rpt-card">
      <div className="rpt-card-head">
        <div>
          <div className="rpt-card-title">Client Performance</div>
          <div className="rpt-card-sub">Hiring activity by client</div>
        </div>
      </div>
      <div className="rpt-card-body rpt-card-body-table">
        {clientPerf.length === 0 ? (
          <p className="rpt-empty">No client data available.</p>
        ) : (
          <table className="rpt-perf-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Open Positions</th>
                <th>Candidates</th>
                <th>Interviews</th>
                <th>Offers</th>
                <th>Hires</th>
                <th>Success %</th>
              </tr>
            </thead>
            <tbody>
              {clientPerf.map((c, i) => (
                <tr key={c.clientName + i}>
                  <td className="rpt-client-name">{c.clientName}</td>
                  <td>{c.openPositions}</td>
                  <td>{c.totalCandidates}</td>
                  <td>{c.interviews}</td>
                  <td>{c.offers}</td>
                  <td><strong>{c.hires}</strong></td>
                  <td>
                    <span className={`rpt-ratio ${c.successRate >= 30 ? 'good' : 'mid'}`}>
                      {c.successRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
})

export default memo(function PerformanceSection({ recruiterPerf, clientPerf }) {
  return (
    <div className="rpt-row">
      <RecruiterLeaderboard recruiterPerf={recruiterPerf} />
      <ClientPerformance clientPerf={clientPerf} />
    </div>
  )
})
