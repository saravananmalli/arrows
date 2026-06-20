import React, { lazy, Suspense, useState, useMemo, useCallback, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import TopBar from '../../components/TopBar'
import { getReportData } from '../../services/dataService'
import KpiCards from './KpiCards'

const FunnelAndTrends    = lazy(() => import('./FunnelAndTrends'))
const PerformanceSection = lazy(() => import('./PerformanceSection'))
const AnalyticsSection   = lazy(() => import('./AnalyticsSection'))
const OfferRevenue       = lazy(() => import('./OfferRevenue'))
const ScheduleSection    = lazy(() => import('./ScheduleSection'))

function SectionLoader() {
  return <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="page-loader-spinner" style={{ width: 24, height: 24 }} />
  </div>
}

const IcoCSV = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="16" y2="17"/>
  </svg>
)
const IcoPDF = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <path d="M9 15h6"/><path d="M9 18h6"/><path d="M9 12h2"/>
  </svg>
)
const IcoXLS = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
    <line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/>
  </svg>
)

function buildCSV(data) {
  const rows = [['Metric', 'Value']]
  Object.entries(data.kpi).forEach(([, v]) => rows.push([v.label, v.value]))
  rows.push([])
  rows.push(['Recruiter', 'Sourced', 'Interviews', 'Offers', 'Hires', 'Success%'])
  data.recruiterPerf.forEach(r => rows.push([r.name, r.sourced, r.interviews, r.offers, r.hires, r.successRatio + '%']))
  rows.push([])
  rows.push(['Client', 'Open Positions', 'Candidates', 'Interviews', 'Offers', 'Hires', 'Success%'])
  data.clientPerf.forEach(c => rows.push([c.clientName, c.openPositions, c.totalCandidates, c.interviews, c.offers, c.hires, c.successRate + '%']))
  return rows.map(r => r.join(',')).join('\n')
}

function downloadCSV(data) {
  const blob = new Blob([buildCSV(data)], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = `arrows-report-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Reports({ theme, onThemeToggle }) {
  const [data, setData] = useState(null)
  useEffect(() => { getReportData().then(setData) }, [])
  const [pdfNote, setPdfNote] = useState(false)
  const [xlsNote, setXlsNote] = useState(false)

  const handleCSV = useCallback(() => downloadCSV(data), [data])
  const handlePDF = useCallback(() => { setPdfNote(true); setTimeout(() => setPdfNote(false), 3500) }, [])
  const handleXLS = useCallback(() => { setXlsNote(true); setTimeout(() => setXlsNote(false), 3500) }, [])

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <TopBar
          title="Reports"
          subtitle={<>Dashboard / <span>Reports</span></>}
          theme={theme}
          onThemeToggle={onThemeToggle}
        />
        <div className="content">
          <div className="rpt-wrap">

            <div className="rpt-export-actions">
              <button className="btn btn-secondary" onClick={handleCSV} title="Download CSV">
                <IcoCSV /> CSV
              </button>
              <button className="btn btn-secondary" onClick={handlePDF} title="Export PDF">
                <IcoPDF /> PDF
              </button>
              <button className="btn btn-secondary" onClick={handleXLS} title="Export Excel">
                <IcoXLS /> Excel
              </button>
              {pdfNote && <span className="rpt-export-note">PDF: use browser print-to-PDF.</span>}
              {xlsNote && <span className="rpt-export-note">Excel: xlsx library needed.</span>}
            </div>

            {!data && <SectionLoader />}
            {data && <KpiCards kpi={data.kpi} />}

            {data && <Suspense fallback={<SectionLoader />}>
              <FunnelAndTrends
                funnelData={data.funnelData}
                monthlyTrend={data.monthlyTrend}
                weeklyActivity={data.weeklyActivity}
              />
            </Suspense>}

            {data && <Suspense fallback={<SectionLoader />}>
              <PerformanceSection
                recruiterPerf={data.recruiterPerf}
                clientPerf={data.clientPerf}
              />
            </Suspense>}

            {data && <Suspense fallback={<SectionLoader />}>
              <AnalyticsSection
                candidateSources={data.candidateSources}
                experienceDist={data.experienceDist}
                skillDemand={data.skillDemand}
                interviewStats={data.interviewStats}
              />
            </Suspense>}

            {data && <Suspense fallback={<SectionLoader />}>
              <OfferRevenue
                offerStats={data.offerStats}
                revenueByClient={data.revenueByClient}
                monthlyRevenue={data.monthlyRevenue}
              />
            </Suspense>}

            <Suspense fallback={<SectionLoader />}>
              <ScheduleSection />
            </Suspense>

          </div>
        </div>
      </div>
    </div>
  )
}
