import { useEffect, useRef } from 'react'

/**
 * Deep-link hydration protocol (PLAN §3).
 *
 * On mount with a hash present:
 *   1. Disable browser scroll restoration
 *   2. Scroll instantly to the anchor BEFORE the scroll-position observer fires
 *   3. Mark currentActId immediately so the canvas snaps to the right state
 *      (no morph from cold-open to the deep-linked act)
 *   4. Suppress hash-update writes for 200ms while the scroll settles
 *
 * Then, normally: when `currentActId` changes via scroll, update the URL hash.
 */

interface UseUrlHashOptions {
  currentActId: string
  actIds: string[]
  setCurrentActId: (id: string) => void
  revalidate: () => void
}

export function useUrlHash({
  currentActId,
  actIds,
  setCurrentActId,
  revalidate,
}: UseUrlHashOptions) {
  const hydratedRef = useRef(false)
  const suppressWriteUntilRef = useRef(0)

  // Step 1–4: initial hydration
  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true

    const hash = window.location.hash.replace(/^#/, '')
    if (!hash || !actIds.includes(hash)) return

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    const el = document.getElementById(hash)
    if (el) {
      // 'instant' is supported by modern browsers; cast keeps TS happy
      el.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' })
    }

    setCurrentActId(hash)
    suppressWriteUntilRef.current = Date.now() + 200

    // After scroll, re-measure anchor positions so the next scroll computation is correct
    requestAnimationFrame(() => {
      revalidate()
    })
  }, [actIds, setCurrentActId, revalidate])

  // Write URL hash to match currentActId (but not during suppression window)
  useEffect(() => {
    if (!hydratedRef.current) return
    if (Date.now() < suppressWriteUntilRef.current) return
    if (!currentActId) return

    const desired = `#${currentActId}`
    if (window.location.hash !== desired) {
      window.history.replaceState(null, '', `${window.location.pathname}${desired}`)
    }
  }, [currentActId])
}
