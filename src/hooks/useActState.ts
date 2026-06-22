import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Scroll-position-driven act-state hook (PLAN §5.4).
 *
 * `currentActId` is determined deterministically by computing which act's anchor
 * range contains `scrollY + viewport*threshold`. IntersectionObserver is NOT used —
 * its async batching causes wrong-order callbacks under fast scroll and
 * deep-link landing.
 *
 * Layout cache invalidates on: resize, orientationchange, document.fonts.ready
 * (KaTeX shifts layout), manual revalidate() (callable from useNearViewport
 * or 3D-mount callbacks).
 */

interface UseActStateOptions {
  /** Ordered list of act DOM ids that exist on the page */
  actIds: string[]
  /** Position from top of viewport (0–1) used as the "current" cursor. PLAN §5.4 = 0.4 */
  threshold?: number
  /**
   * When false, the scroll listener is paused and `currentActId` only changes
   * via explicit `setCurrentActId` calls. Used by the fullscreen overlay so
   * body-scroll-lock layout reflows don't snap the act back to scrollY=0.
   * Defaults to true.
   */
  enabled?: boolean
}

interface AnchorRange {
  top: number
  bottom: number
}

export function useActState({ actIds, threshold = 0.4, enabled = true }: UseActStateOptions) {
  const [currentActId, setCurrentActId] = useState<string>(actIds[0] ?? '')
  const positionsRef = useRef<Map<string, AnchorRange>>(new Map())
  const rafRef = useRef<number | null>(null)

  const recomputePositions = useCallback(() => {
    const positions = new Map<string, AnchorRange>()
    for (const id of actIds) {
      const el = document.getElementById(id)
      if (!el) continue
      const rect = el.getBoundingClientRect()
      positions.set(id, {
        top: rect.top + window.scrollY,
        bottom: rect.bottom + window.scrollY,
      })
    }
    positionsRef.current = positions
  }, [actIds])

  const computeCurrentAct = useCallback(() => {
    const cursor = window.scrollY + window.innerHeight * threshold
    let candidate = actIds[0] ?? ''
    // Acts are in document order; the last anchor above the cursor is current
    for (const id of actIds) {
      const range = positionsRef.current.get(id)
      if (range && range.top <= cursor) {
        candidate = id
      }
    }
    setCurrentActId((prev) => (prev === candidate ? prev : candidate))
  }, [actIds, threshold])

  const revalidate = useCallback(() => {
    recomputePositions()
    computeCurrentAct()
  }, [recomputePositions, computeCurrentAct])

  useEffect(() => {
    if (!enabled) {
      // Paused: don't bind listeners and don't auto-recompute. The caller is
      // driving `currentActId` manually (e.g. fullscreen overlay).
      return
    }
    // Initial measure
    recomputePositions()
    computeCurrentAct()

    const onScroll = () => {
      if (rafRef.current !== null) return
      rafRef.current = requestAnimationFrame(() => {
        computeCurrentAct()
        rafRef.current = null
      })
    }

    const invalidate = () => {
      // Cancel any pending scroll-driven rAF; we're recomputing now
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      recomputePositions()
      computeCurrentAct()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', invalidate)
    window.addEventListener('orientationchange', invalidate)

    // Fonts ready — KaTeX + Source Serif 4 shift layout when they load.
    // Trigger an invalidation when both are settled.
    if (document.fonts?.ready) {
      void document.fonts.ready.then(invalidate)
    }

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', invalidate)
      window.removeEventListener('orientationchange', invalidate)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [enabled, recomputePositions, computeCurrentAct])

  return { currentActId, setCurrentActId, revalidate }
}
