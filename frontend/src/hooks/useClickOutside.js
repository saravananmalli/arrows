import { useEffect } from 'react'

export function useClickOutside(ref, handler) {
  useEffect(() => {
    function onOut(e) {
      if (ref.current && !ref.current.contains(e.target)) handler()
    }
    document.addEventListener('mousedown', onOut)
    return () => document.removeEventListener('mousedown', onOut)
  }, []) // ref is a stable box; handler must be a stable setter (setState/useCallback)
}
