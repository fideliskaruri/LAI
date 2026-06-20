import { useEffect, type RefObject } from 'react'

/**
 * Keyboard nudge handler for a focusable element. Adds arrow-key listeners
 * that call `onNudge(dx, dy)` with normalised unit deltas. Shift+arrow
 * nudges by `largeStep` (default 10) units of the same direction.
 *
 * PLAN §11.1: every draggable is keyboard-nudgeable. This is the primitive.
 */

interface UseKeyNudgeOptions {
  /** Larger step when Shift is held. Default 10. */
  largeStep?: number
  /** Disable nudging (e.g. when focus is in a text input). Default false. */
  disabled?: boolean
}

export function useKeyNudge(
  ref: RefObject<HTMLElement | SVGElement | null>,
  onNudge: (dx: number, dy: number) => void,
  { largeStep = 10, disabled = false }: UseKeyNudgeOptions = {},
) {
  useEffect(() => {
    const el = ref.current
    if (!el || disabled) return

    const handler = (e: KeyboardEvent) => {
      const step = e.shiftKey ? largeStep : 1
      let dx = 0
      let dy = 0
      switch (e.key) {
        case 'ArrowLeft':
          dx = -step
          break
        case 'ArrowRight':
          dx = step
          break
        case 'ArrowUp':
          dy = step
          break
        case 'ArrowDown':
          dy = -step
          break
        default:
          return
      }
      e.preventDefault()
      onNudge(dx, dy)
    }

    el.addEventListener('keydown', handler as EventListener)
    return () => el.removeEventListener('keydown', handler as EventListener)
  }, [ref, onNudge, largeStep, disabled])
}
