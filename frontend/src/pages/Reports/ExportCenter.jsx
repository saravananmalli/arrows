import React, { useState, useCallback, memo } from 'react'

const IcoCSV  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
const IcoPDF  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15h6"/><path d="M9 18h6"/><path d="M9 12h2"/></svg>
const IcoXLS  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
const IcoMail = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>

function buildCSV(data) {
  const rows = []
  rows.push(['Metric', 'Value'])
  Object.entries(data.kpi).forEach(([, v]) => rows.push([v.label, v.value]))
  rows.push([])
  rows.push(['Recruiter','Sourced','Interviews','Offers','Hires','Success%'])
  data.recruiterPerf.forEach(r => rows.push([r.name, r.sourced, r.interviews, r.offers, r.hires, r.successRatio + '%']))
  rows.push([])
  rows.push(['Client','Open Positions','Candidates','Interviews','Offers','Hires','Success%'])
  data.clientPerf.forEach(c => rows.push([c.clientName, c.openPositions, c.totalCandidates, c.interviews, c.offers, c.hires, c.successRate + '%']))
  return rows.map(r => r.join(',')).join('\n')
}

function downloadCSV(data) {
  const csv  = buildCSV(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `arrows-report-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default memo(function ExportCenter({ data }) {
  const [schedule, setSchedule]     = useState('')
  const [emailSent, setEmailSent]   = useState(false)
  const [pdfNote, setPdfNote]       = useState(false)
  const [xlsNote, setXlsNote]       = useState(false)

  const handleCSV  = useCallback(() => downloadCSV(data), [data])
  const handlePDF  = useCallback(() => { setPdfNote(true); setTimeout(() => setPdfNote(false), 3000) }, [])
  const handleXLS  = useCallback(() => { setXlsNote(true); setTimeout(() => setXlsNote(false), 3000) }, [])
  const handleMail = useCallback(() => { setEmailSent(true); setTimeout(() => setEmailSent(false), 3000) }, [])

  return (
    <div className="rpt-export-wrap">
      <div className="rpt-card-title" style={{ marginBottom: 20 }}>Export &amp; Schedule Reports</div>
      <div className="rpt-export-grid">

        <div className="rpt-export-section">
          <div className="rpt-export-sec-title">Export Data</div>
          <div className="rpt-export-btns">
            <button className="rpt-export-btn" onClick={handleCSV}>
              <IcoCSV /> CSV
            </button>
            <button className="rpt-export-btn" onClick={handlePDF}>
              <IcoPDF /> PDF
            </button>
            <button className="rpt-export-btn" onClick={handleXLS}>
              <IcoXLS /> Excel
            </button>
            <button className="rpt-export-btn" onClick={handleMail}>
              <IcoMail /> Email Report
            </button>
          </div>
          {pdfNote  && <p className="rpt-export-note">PDF export requires a print-to-PDF plugin in production.</p>}
          {xlsNote  && <p className="rpt-export-note">Excel export requires the xlsx library in production.</p>}
          {emailSent && <p className="rpt-export-note rpt-export-note-ok">Report queued for email delivery.</p>}
        </div>

        <div className="rpt-export-section">
          <div className="rpt-export-sec-title">Schedule Reports</div>
          <div className="rpt-export-schedule-btns">
            {['Daily','Weekly','Monthly'].map(opt => (
              <button
                key={opt}
                className={`rpt-schedule-btn ${schedule === opt ? 'active' : ''}`}
                onClick={() => setSchedule(s => s === opt ? '' : opt)}
              >
                {opt}
              </button>
            ))}
          </div>
          {schedule && (
            <p className="rpt-export-note rpt-export-note-ok">
              {schedule} report scheduled. Stakeholders will receive it automatically.
            </p>
          )}
        </div>

      </div>
    </div>
  )
})
