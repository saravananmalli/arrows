import React, { memo, useState, useCallback, useMemo } from 'react'

// ── FilterIcon ────────────────────────────────────────────────
export const FilterIcon = memo(function FilterIcon({ width = 15, height = 15 }) {
  return (
    <svg
      width={width} height={height} viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round"
    >
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  )
})


// ── EmptyState ────────────────────────────────────────────────
export const EmptyState = memo(function EmptyState({ message, colSpan }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13 }}
      >
        {message ?? 'No data available.'}
      </td>
    </tr>
  )
})

// ── LoadingState ──────────────────────────────────────────────
export const LoadingState = memo(function LoadingState({ rows = 3, colSpan }) {
  return Array.from({ length: rows }, (_, i) => (
    <tr key={i}>
      {Array.from({ length: colSpan }, (_, j) => (
        <td key={j}><span className="td-skeleton-inline" /></td>
      ))}
    </tr>
  ))
})

// ── TableCell ─────────────────────────────────────────────────
export const TableCell = memo(function TableCell({ column, row, rowIndex }) {
  const value = row[column.key]
  return (
    <td style={column.width ? { width: column.width } : undefined}>
      {column.render ? column.render(value, row, rowIndex) : (value ?? '—')}
    </td>
  )
})

// ── TableActions ──────────────────────────────────────────────
export const TableActions = memo(function TableActions({ actions, row }) {
  return (
    <td>
      <div className="tbl-actions">
        {actions.map((action, i) => (
          <button
            key={i}
            className={`tbl-action-btn${action.variant ? ` ${action.variant}` : ''}`}
            title={action.label}
            onClick={action.onClick ? () => action.onClick(row) : undefined}
          >
            {action.icon}
          </button>
        ))}
      </div>
    </td>
  )
})

// ── TableRow ──────────────────────────────────────────────────
export const TableRow = memo(function TableRow({
  row, columns, actions, rowKey, rowIndex,
  expandable, isExpanded, onToggle, renderExpanded, totalCols,
}) {
  return (
    <>
      <tr className={isExpanded ? 'row-expanded' : ''}>
        {expandable && (
          <td className="td-expand">
            <button
              className={`expand-btn${isExpanded ? ' open' : ''}`}
              onClick={() => onToggle(row[rowKey])}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M7 5l6 5-6 5" />
              </svg>
            </button>
          </td>
        )}
        {columns.map(col => (
          <TableCell key={col.key} column={col} row={row} rowIndex={rowIndex} />
        ))}
        {actions?.length > 0 && <TableActions actions={actions} row={row} />}
      </tr>
      {expandable && isExpanded && (
        <tr className="expanded-row">
          <td colSpan={totalCols} className="expanded-cell">
            <div className="nested-wrap">
              <div className="nested-inner">
                {renderExpanded?.(row)}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
})

// ── SortIcon ──────────────────────────────────────────────────
function SortIcon({ active, dir }) {
  return (
    <svg
      width="10" height="14" viewBox="0 0 10 16"
      fill="currentColor"
      style={{ flexShrink: 0, opacity: active ? 0.85 : 0.35 }}
    >
      <path d="M5 0L0.5 6h9L5 0z"   opacity={active && dir === 'asc'  ? 1 : 0.45} />
      <path d="M5 16l4.5-6h-9L5 16z" opacity={active && dir === 'desc' ? 1 : 0.45} />
    </svg>
  )
}

// ── TableHeader ───────────────────────────────────────────────
export const TableHeader = memo(function TableHeader({
  columns, actions, expandable, sortKey, sortDir, onSort,
}) {
  return (
    <thead>
      <tr>
        {expandable && <th style={{ width: 32 }} />}
        {columns.map(col => {
          const isActive  = sortKey === col.key
          const clickable = col.sortable && onSort
          return (
            <th
              key={col.key}
              style={{
                ...(col.width ? { width: col.width } : {}),
                ...(clickable ? { cursor: 'pointer', userSelect: 'none' } : {}),
              }}
              onClick={clickable ? () => onSort(col.key) : undefined}
            >
              {clickable ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {col.label}
                  <SortIcon active={isActive} dir={sortDir} />
                </span>
              ) : col.label}
            </th>
          )
        })}
        {actions?.length > 0 && <th>Actions</th>}
      </tr>
    </thead>
  )
})

// ── DataTable ─────────────────────────────────────────────────
// Column definition shape:
//   { key, label, sortable?, width?, render?(value, row, rowIndex) }
//
// Action definition shape:
//   { icon, label, onClick?(row), variant? }
function DataTable({
  columns,
  rows = [],
  actions,
  expandable = false,
  renderExpanded,
  defaultExpanded,
  className = '',
  emptyMessage,
  loading = false,
  loadingRows = 3,
  rowKey = 'id',
  sortKey,
  sortDir,
  onSort,
}) {
  const [expanded, setExpanded] = useState(() => defaultExpanded ?? new Set())

  const toggle = useCallback((id) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const totalCols = useMemo(() => {
    let n = columns.length
    if (expandable) n += 1
    if (actions?.length > 0) n += 1
    return n
  }, [columns.length, expandable, actions?.length])

  return (
    <table className={className}>
      <TableHeader
        columns={columns} actions={actions} expandable={expandable}
        sortKey={sortKey} sortDir={sortDir} onSort={onSort}
      />
      <tbody>
        {loading ? (
          <LoadingState rows={loadingRows} colSpan={totalCols} />
        ) : rows.length === 0 ? (
          <EmptyState message={emptyMessage} colSpan={totalCols} />
        ) : (
          rows.map((row, index) => (
            <TableRow
              key={row[rowKey]}
              row={row}
              columns={columns}
              actions={actions}
              rowKey={rowKey}
              rowIndex={index}
              expandable={expandable}
              isExpanded={expanded.has(row[rowKey])}
              onToggle={toggle}
              renderExpanded={renderExpanded}
              totalCols={totalCols}
            />
          ))
        )}
      </tbody>
    </table>
  )
}

export default memo(DataTable)
