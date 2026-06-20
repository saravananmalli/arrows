import { useRef, useCallback, useMemo } from 'react'
import { useClickOutside } from '../../hooks/useClickOutside'
import MatchingScore from './MatchingScore'

export default function RoleDropdown({
  roles,
  candidatesByRole,
  mappedIds,
  selectedRole,
  onRoleChange,
  checked,
  onCheckedChange,
  open,
  onOpenChange,
}) {
  const ref = useRef(null)
  useClickOutside(ref, () => onOpenChange(false))

  const candidates = useMemo(
    () => (candidatesByRole[selectedRole] || []).filter(c => !mappedIds.has(c.id)),
    [candidatesByRole, selectedRole, mappedIds],
  )

  const allChecked  = candidates.length > 0 && candidates.every(c => checked.has(c.id))
  const someChecked = candidates.some(c => checked.has(c.id))

  const toggleAll = useCallback(() => {
    onCheckedChange(prev => {
      const next = new Set(prev)
      if (allChecked) {
        candidates.forEach(c => next.delete(c.id))
      } else {
        candidates.forEach(c => next.add(c.id))
      }
      return next
    })
  }, [allChecked, candidates, onCheckedChange])

  const toggleOne = useCallback((id) => {
    onCheckedChange(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [onCheckedChange])

  return (
    <div className="jd-role-dropdown" ref={ref}>
      <button
        className={`jd-role-trigger${open ? ' open' : ''}`}
        onClick={() => onOpenChange(!open)}
      >
        <span>{selectedRole || 'Select Role'}</span>
        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M5 8l5 5 5-5"/>
        </svg>
      </button>

      {open && (
        <div className="jd-role-panel">
          {/* Role pills */}
          <div className="jd-role-tabs">
            {roles.map(role => (
              <button
                key={role}
                className={`jd-role-tab${selectedRole === role ? ' active' : ''}`}
                onClick={() => onRoleChange(role)}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Candidate list */}
          <div className="jd-role-cand-list">
            {candidates.length === 0 ? (
              <p className="jd-role-empty">No available candidates for this role.</p>
            ) : (
              <>
                <label className="jd-role-cand-item jd-role-select-all">
                  <input
                    type="checkbox"
                    className="jd-checkbox"
                    checked={allChecked}
                    ref={el => { if (el) el.indeterminate = someChecked && !allChecked }}
                    onChange={toggleAll}
                  />
                  <span className="jd-role-select-all-label">
                    Select All <span className="jd-role-count">({candidates.length})</span>
                  </span>
                </label>

                {candidates.map(c => (
                  <label key={c.id} className="jd-role-cand-item">
                    <input
                      type="checkbox"
                      className="jd-checkbox"
                      checked={checked.has(c.id)}
                      onChange={() => toggleOne(c.id)}
                    />
                    <div className="jd-role-cand-info">
                      <span className="jd-role-cand-name">{c.name}</span>
                      <span className="jd-role-cand-email">{c.email}</span>
                    </div>
                    <MatchingScore value={c.score} />
                  </label>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
