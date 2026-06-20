import { useEffect } from 'react'

/**
 * Lock body scroll while `locked` is true, preserving the user's exact
 * scroll position. Restores on unlock.
 *
 * Uses the position-fixed trick (set body to position:fixed at negative
 * top offset, then on release restore position and scrollTo). This is the
 * iOS-Safari-safe alternative to `body.style.overflow = 'hidden'`, which
 * can collapse body height and snap scrollY to 0 on release — which then
 * causes IntersectionObservers (e.g. useActState) to fire spurious updates.
 */
export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const y = window.scrollY
    const body = document.body
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflowY: body.style.overflowY,
    }
    body.style.position = 'fixed'
    body.style.top = `-${y}px`
    body.style.width = '100%'
    body.style.overflowY = 'scroll' // prevent reflow when scrollbar disappears
    return () => {
      body.style.position = prev.position
      body.style.top = prev.top
      body.style.width = prev.width
      body.style.overflowY = prev.overflowY
      window.scrollTo(0, y)
    }
  }, [locked])
}
