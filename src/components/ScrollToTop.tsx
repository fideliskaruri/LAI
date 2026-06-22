import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Reset window scroll to (0, 0) on every pathname change.
 *
 * React Router preserves scroll position across navigation by default, which
 * means clicking "next chapter" at the end of a 30-screen page lands the
 * reader at the bottom of the new chapter. Mount this once inside
 * `<BrowserRouter>`; it has no UI.
 *
 * Hash changes (deep links to acts within a topic) are handled by
 * `useUrlHash` per `PLAN §3` — we don't override those here.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
