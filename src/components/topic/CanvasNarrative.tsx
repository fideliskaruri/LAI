import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

/**
 * Visually-hidden live region that mirrors the visual state of a canvas in
 * prose, so screen-reader users get the same teaching as sighted users.
 *
 * PLAN §11.1: announcement state machine.
 *   - Drag-in-progress (`isInteracting=true`): trailing-edge debounce
 *     (default 350ms) on normal-priority text.
 *   - Pointer-up / discrete events (`isInteracting=false`): fire normal
 *     immediately. Consumers can also call `ref.flush()` explicitly.
 *   - High-priority (degenerate-case, act-transition): fires immediately,
 *     cancels any pending debounced text, AND holds the floor for 800ms —
 *     during that window normal-priority text is suppressed so the
 *     screen-reader actually gets to read the critical message before the
 *     stream of position updates resumes.
 *   - High-priority replaces high-priority immediately (no hold).
 *
 * The `<div role="status">` is always rendered; its text content updates
 * rather than mounting/unmounting, so aria-live picks up every change.
 */

const HIGH_PRIORITY_HOLD_MS = 800

export interface CanvasNarrativeHandle {
  /** Force the latest normal-priority text out now, cancelling any debounce. */
  flush: () => void
}

interface CanvasNarrativeProps {
  /** The current narration text — typically derived from the canvas state */
  text: string
  /** 'normal' debounces while interacting; 'high' fires immediately and holds. */
  priority?: 'normal' | 'high'
  /**
   * If true, normal-priority text is debounced (default 350ms). If false,
   * normal-priority text fires immediately. Defaults to false.
   */
  isInteracting?: boolean
  /** Debounce ms for 'normal' priority while interacting. Default 350. */
  debounceMs?: number
}

export const CanvasNarrative = forwardRef<CanvasNarrativeHandle, CanvasNarrativeProps>(
  function CanvasNarrative(
    { text, priority = 'normal', isInteracting = false, debounceMs = 350 },
    ref,
  ) {
    const [announced, setAnnounced] = useState(text)

    // Pending debounce timer for normal-priority updates.
    const timerRef = useRef<number | null>(null)
    // Latest normal-priority text that has been requested but not yet fired
    // (kept up to date so `flush()` can emit the current value).
    const pendingTextRef = useRef<string>(text)
    // When a high-priority text is fired, this becomes the timestamp until
    // which normal-priority updates are suppressed.
    const highPriorityHoldRef = useRef<{ until: number; text: string } | null>(null)
    // Timer that clears the hold and then flushes any pending normal text.
    const holdTimerRef = useRef<number | null>(null)

    const clearDebounce = useCallback(() => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }, [])

    const clearHoldTimer = useCallback(() => {
      if (holdTimerRef.current !== null) {
        clearTimeout(holdTimerRef.current)
        holdTimerRef.current = null
      }
    }, [])

    // Imperative flush — emit the latest normal-priority text immediately.
    // Respects the high-priority hold: if the hold is still active, flush
    // is a no-op (the held text stays on the live region).
    useImperativeHandle(
      ref,
      () => ({
        flush: () => {
          clearDebounce()
          const hold = highPriorityHoldRef.current
          if (hold && performance.now() < hold.until) return
          setAnnounced(pendingTextRef.current)
        },
      }),
      [clearDebounce],
    )

    useEffect(() => {
      pendingTextRef.current = text

      if (priority === 'high') {
        // High-priority always fires immediately and cancels pending.
        clearDebounce()
        clearHoldTimer()
        highPriorityHoldRef.current = {
          until: performance.now() + HIGH_PRIORITY_HOLD_MS,
          text,
        }
        setAnnounced(text)
        // After the hold window, release and flush whatever pending normal
        // text is current at that moment.
        holdTimerRef.current = window.setTimeout(() => {
          highPriorityHoldRef.current = null
          holdTimerRef.current = null
          setAnnounced(pendingTextRef.current)
        }, HIGH_PRIORITY_HOLD_MS)
        return
      }

      // Normal priority — check the high-priority hold first.
      const hold = highPriorityHoldRef.current
      if (hold && performance.now() < hold.until) {
        // Hold is active; do not overwrite. pendingTextRef is already
        // updated, so the hold-timer fallback will emit the latest text
        // when the hold expires.
        clearDebounce()
        return
      }

      if (!isInteracting) {
        // Discrete event / pointer-up — fire immediately.
        clearDebounce()
        setAnnounced(text)
        return
      }

      // Drag in progress — trailing-edge debounce.
      clearDebounce()
      timerRef.current = window.setTimeout(() => {
        setAnnounced(pendingTextRef.current)
        timerRef.current = null
      }, debounceMs)
    }, [text, priority, isInteracting, debounceMs, clearDebounce, clearHoldTimer])

    useEffect(
      () => () => {
        clearDebounce()
        clearHoldTimer()
      },
      [clearDebounce, clearHoldTimer],
    )

    return (
      <div className="sr-only" aria-live="polite" aria-atomic="true" role="status">
        {announced}
      </div>
    )
  },
)
