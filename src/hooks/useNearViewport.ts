import { useEffect, useState, type RefObject } from 'react'

/**
 * Returns true when the observed element is within `rootMargin` of the viewport.
 * Used to mount expensive components (3D scenes) only when they're nearly visible,
 * and unmount them when far away. PLAN §5.7.
 */
export function useNearViewport<T extends Element>(
  ref: RefObject<T | null>,
  // IntersectionObserver rootMargin accepts only px or %, NOT vh.
  // 200% top/bottom = "extend viewport by 2× above and below" — PLAN §5.7's
  // "within 2 viewports" semantic.
  rootMargin = '200% 0px',
): boolean {
  const [near, setNear] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setNear(entry.isIntersecting),
      { rootMargin, threshold: 0 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [ref, rootMargin])

  return near
}
