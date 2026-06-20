import { useEffect, useRef, useState } from 'react'

/**
 * Visually-hidden live region that mirrors the visual state of a canvas in
 * prose, so screen-reader users get the same teaching as sighted users.
 *
 * PLAN §11.1: announcement state machine.
 *   - Drag-in-progress: trailing-edge debounce (default 350ms)
 *   - Pointer-up / discrete events: immediate
 *   - High-priority (degenerate-case, act-transition): immediate, cancels
 *     any pending debounced text
 *
 * Pass `priority="high"` to fire immediately and cancel any pending update.
 */

interface CanvasNarrativeProps {
  /** The current narration text — typically derived from the canvas state */
  text: string
  /** 'normal' debounces; 'high' fires immediately and cancels pending */
  priority?: 'normal' | 'high'
  /** Debounce ms for 'normal' priority. Default 350. */
  debounceMs?: number
}

export function CanvasNarrative({
  text,
  priority = 'normal',
  debounceMs = 350,
}: CanvasNarrativeProps) {
  const [announced, setAnnounced] = useState(text)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (priority === 'high') {
      // Fire immediately; aria-live will pick up the change.
      setAnnounced(text)
      return
    }

    timerRef.current = window.setTimeout(() => {
      setAnnounced(text)
      timerRef.current = null
    }, debounceMs)

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
  }, [text, priority, debounceMs])

  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true" role="status">
      {announced}
    </div>
  )
}
