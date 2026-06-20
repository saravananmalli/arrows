import React, { memo, useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import RecruitmentStatus from '../components/RecruitmentStatus'
import TodayTasks from '../components/TodayTasks'
import HiringMetrics from '../components/HiringMetrics'
import CandidatesTable from '../components/CandidatesTable'
import UpcomingSchedules from '../components/UpcomingSchedules'
import { useDashboard, useDashboardCandidates, useTodayTasks } from '../hooks/queries/useDashboard'
import { useAuth } from '../contexts/AuthContext'

// ── Live clock ────────────────────────────────────────────────
function useLiveClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

// ── Welcome card ──────────────────────────────────────────────
function WelcomeCard({ user, now }) {
  const h        = now.getHours()
  const greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'
  const firstName = (user?.name || 'User').split(' ')[0]
  const dateStr   = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr   = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div className="welcome-card">
      <div className="welcome-card-greeting">{greeting},</div>
      <div className="welcome-card-name">{firstName}!</div>
      <div className="welcome-card-meta">
        <span className="welcome-card-meta-item">
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="16" height="14" rx="2"/>
            <path d="M6 2v4M14 2v4M2 9h16"/>
          </svg>
          {dateStr}
        </span>
        <span className="welcome-card-meta-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
          {timeStr}
        </span>
      </div>
    </div>
  )
}

// ── KPI icons (defined once, not inline) ─────────────────────
const ICON_BRIEFCASE = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
  </svg>
)
const ICON_AWARD = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="6"/>
    <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
  </svg>
)
const ICON_CLOCK = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
  </svg>
)
const ICON_MAP = { briefcase: ICON_BRIEFCASE, award: ICON_AWARD, clock: ICON_CLOCK }

const ARROW_UP = (
  <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 4l6 7H4l6-7z"/>
  </svg>
)
const ARROW_DOWN = (
  <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 16l-6-7h12l-6 7z"/>
  </svg>
)

// ── KPI metric card ───────────────────────────────────────────
function KpiCard({ title, value, change, period, icon, color }) {
  const isUp = change >= 0
  return (
    <div className="kpi-card">
      <div className={`kpi-card-icon kpi-card-icon--${color}`}>
        {ICON_MAP[icon]}
      </div>
      <div className="kpi-card-body">
        <div className="kpi-card-top">
          <span className="kpi-card-value">{value}</span>
          <span className={`kpi-card-badge kpi-card-badge--${isUp ? 'up' : 'down'}`}>
            {isUp ? ARROW_UP : ARROW_DOWN}
            {Math.abs(change).toFixed(2)}%
          </span>
        </div>
        <div className="kpi-card-title">{title}</div>
        <div className="kpi-card-period">{period}</div>
      </div>
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="dash-layout">
      <div className="dash-kpi-row">
        {[0, 1, 2].map(n => <div key={n} className="kpi-card skeleton-pulse dash-skel-kpi" />)}
        <div className="welcome-card skeleton-pulse dash-skel-kpi" />
      </div>
      <div className="dash-mid-row">
        <div className="recruit-card skeleton-pulse dash-skel-chart" />
        <div className="metrics-card skeleton-pulse dash-skel-chart" />
        <div className="schedules-card skeleton-pulse dash-skel-chart" />
      </div>
      <div className="dash-bottom-row">
        <div className="candidates-card skeleton-pulse dash-skel-table" />
        <div className="tasks-card skeleton-pulse dash-skel-table" />
      </div>
    </div>
  )
}

// ── Main dashboard page ───────────────────────────────────────
export default function Dashboard() {
  const [page, setPage]         = useState(1)
  const [pageSize, setPageSize] = useState(7)
  const now  = useLiveClock()
  const { user } = useAuth()

  const { data: dashData, isLoading, isError } = useDashboard()
  const { data: candidateData } = useDashboardCandidates({ page, size: pageSize })
  const { data: todayTasks = [], isLoading: tasksLoading } = useTodayTasks()

  const candidates     = candidateData?.data  ?? []
  const candidateTotal = candidateData?.total ?? 0

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize)
    setPage(1)
  }

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <TopBar title="Dashboard" />

        {isLoading ? (
          <div className="content"><DashboardSkeleton /></div>
        ) : isError ? (
          <div className="content">
            <div className="dashboard-error">Failed to load dashboard data.</div>
          </div>
        ) : (
          <div className="content">
            <div className="dash-layout">

              {/* ── Row 1: 4 equal KPI cards ─────────────────── */}
              <div className="dash-kpi-row">
                <KpiCard
                  title="Open Positions"
                  value={dashData.stats.openPositions.total}
                  change={dashData.stats.openPositions.change}
                  period={dashData.stats.openPositions.period}
                  icon="briefcase"
                  color="blue"
                />
                <KpiCard
                  title="New Hires"
                  value={dashData.stats.newHire.total}
                  change={dashData.stats.newHire.change}
                  period={dashData.stats.newHire.period}
                  icon="award"
                  color="green"
                />
                <KpiCard
                  title="Requirements"
                  value={dashData.stats.requirements.total.toLocaleString()}
                  change={dashData.stats.requirements.change}
                  period={dashData.stats.requirements.period}
                  icon="clock"
                  color="orange"
                />
                <WelcomeCard user={user} now={now} />
              </div>

              {/* ── Row 2: 3 equal-height cards, scroll if big ── */}
              <div className="dash-mid-row">
                <RecruitmentStatus data={dashData.recruitment} />
                <HiringMetrics data={dashData.hiringMetrics} />
                <UpcomingSchedules />
              </div>

              {/* ── Row 3: 2 equal-height cards ──────────────── */}
              <div className="dash-bottom-row">
                <CandidatesTable
                  candidates={candidates}
                  total={candidateTotal}
                  page={page}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={handlePageSizeChange}
                />
                <TodayTasks tasks={todayTasks} isLoading={tasksLoading} />
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}
