import React, { memo } from 'react'

const IcoFilter = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
)

const IcoSearch = () => (
  <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="8.5" cy="8.5" r="5.5"/><path d="M15 15l3 3"/>
  </svg>
)

const IcoMore = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
    <circle cx="4" cy="10" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="16" cy="10" r="1.5"/>
  </svg>
)

// Layout-shell filter bar.
// Renders the outer wrapper, filter icon, search input, ··· button, and
// Clear / Apply buttons. Pass SelectFilter / FilterDropdown / DateRangeFilter
// etc. as children — they slot in between the search and the ··· button.
//
// Props:
//   search      – controlled search string
//   onSearch    – called with the new string value (not the event)
//   onClear     – called when Clear is clicked
//   onApply     – optional; if provided an Apply button is shown
//   placeholder – input placeholder, defaults to "Search"
//   children    – filter dropdown components
function FilterBar({ search, onSearch, onClear, onApply, placeholder = 'Search', children }) {
  return (
    <div className="job-filter">
      <span className="job-filter-icon"><IcoFilter /></span>

      <div className="job-filter-search">
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder={placeholder}
        />
        <IcoSearch />
      </div>

      {children}


      <div className="job-filter-actions">
        <button
          className="btn btn-secondary"
          style={{ height: 32, padding: '0 14px', fontSize: 12.5 }}
          onClick={onClear}
        >
          Clear
        </button>
        {onApply && (
          <button
            className="btn btn-primary"
            style={{ height: 32, padding: '0 14px', fontSize: 12.5 }}
            onClick={onApply}
          >
            Apply
          </button>
        )}
      </div>
    </div>
  )
}

export default memo(FilterBar)
