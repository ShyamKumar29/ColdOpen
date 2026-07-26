import { useEffect } from 'react'
import { useColdOpenStore } from '@store'

/**
 * Syncs the OS `prefers-reduced-motion` preference into `settingsSlice`
 * (CLAUDE.md Accessibility Rules — respected everywhere animation occurs,
 * not treated as optional polish). A thin adapter only: the media query is
 * the only thing this hook knows about.
 */
export function useReducedMotionPreference(): void {
  const setReducedMotion = useColdOpenStore((state) => state.setReducedMotion)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(query.matches)

    const handleChange = (event: MediaQueryListEvent): void => setReducedMotion(event.matches)
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [setReducedMotion])
}
