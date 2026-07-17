import { useState, useEffect } from 'react'

/**
 * Track a CSS media query in React. Re-renders when the match changes,
 * so components can branch on viewport size (e.g. desktop grid vs mobile drawer).
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e) => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

/** True on phones / narrow tablets — the breakpoint where the sidebar collapses to a drawer. */
export function useIsMobile() {
  return useMediaQuery('(max-width: 900px)')
}
