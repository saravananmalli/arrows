import { useMemo } from 'react'

/**
 * Reads live CSS variable values from the document root so Recharts
 * charts respond to the dark/light theme toggle without hardcoded hex.
 *
 * @returns {{ grid, tick, barInactive, barActive, text, border }} Chart color tokens
 */
export function useChartColors() {
  return useMemo(() => {
    const style = getComputedStyle(document.documentElement)
    const get   = (name) => style.getPropertyValue(name).trim()
    return {
      grid:       get('--chart-grid')         || '#F3F4F6',
      tick:       get('--chart-tick')         || '#9CA3AF',
      barInactive: get('--chart-bar-inactive') || '#C7D2FE',
      barActive:  get('--chart-bar-active')   || '#3F90F6',
      text:       get('--text-primary')       || '#111827',
      textMuted:  get('--text-secondary')     || '#6B7280',
      border:     get('--border')             || '#E5E7EB',
      cardBg:     get('--card-bg')            || '#FFFFFF',
      green:      get('--green')              || '#22C55E',
      primary:    get('--primary')            || '#3F90F6',
    }
  // Re-derive when the theme data-attribute changes (theme toggle).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document.documentElement.dataset.theme])
}
