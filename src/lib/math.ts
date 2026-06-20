/**
 * Shared math helpers for playables.
 */

/** Clamp `value` into `[min, max]`. If min > max, returns value. */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) return value
  if (value < min) return min
  if (value > max) return max
  return value
}

/**
 * Visible math-coordinate bounds for the canonical 600x480 viewBox playables
 * where 1 math unit = 50 px and the origin is at (300, 240). Used to clamp
 * keyboard-nudged points so auto-repeat can't walk a handle off-canvas.
 */
export const MATH_X_MIN = -5.5
export const MATH_X_MAX = 5.5
export const MATH_Y_MIN = -4
export const MATH_Y_MAX = 4
