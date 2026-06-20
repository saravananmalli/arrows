import localFallback from '../data/masters.json'

/**
 * All lookup/reference data comes from GET /api/masters (backed by the JSON store,
 * and later by a real database). The bundled masters.json is used only if the API
 * is unreachable (offline dev, network error).
 *
 * initMasters() must be called and awaited before the React tree mounts so that
 * every constants.js module that does  `const TABS = masters.pipelineTabs`  reads
 * live API data rather than a stale bundle snapshot.
 */

// Mutable object — properties are filled in by initMasters()
export const masters = {}

export async function initMasters() {
  try {
    const res = await fetch('/api/masters')
    if (res.ok) {
      const data = await res.json()
      Object.assign(masters, data)
      return
    }
  } catch {
    // API unreachable — fall through to local fallback
  }
  // Fallback: bundled JSON (same data, just not from the server)
  Object.assign(masters, localFallback.masters)
}
