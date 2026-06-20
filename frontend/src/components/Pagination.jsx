import React, { useMemo, memo } from 'react'

const IcoPrev = () => (
  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M13 5l-6 5 6 5"/>
  </svg>
)

const IcoNext = () => (
  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M7 5l6 5-6 5"/>
  </svg>
)

function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pages = useMemo(() => Array.from({ length: totalPages }, (_, i) => i + 1), [totalPages])

  return (
    <div className="job-footer">
      <div className="table-info">
        Show
        <select
          className="show-entries-select"
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        entries
      </div>
      <div className="pagination">
        <button className="page-btn" disabled={page === 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <IcoPrev />
        </button>
        {pages.map(p => (
          <button
            key={p}
            className={`page-btn${page === p ? ' active' : ''}`}
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={page === p ? 'page' : undefined}
          >
            {p}
          </button>
        ))}
        <button className="page-btn" disabled={page === totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          <IcoNext />
        </button>
      </div>
    </div>
  )
}

export default memo(Pagination)
