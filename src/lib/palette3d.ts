/**
 * Palette constants for react-three-fiber scenes.
 *
 * r3f materials are CPU-side strings, so they cannot read CSS variables
 * directly. These constants mirror the active values in
 * `src/index.css`'s `@theme` block. When the page theme flips, update
 * this file in lockstep.
 */
export const PALETTE_3D = {
  /** Mirror of --color-vermilion (the brighter dark-mode vermilion). */
  vermilion: '#E0584A',
  /** Mirror of --color-vermilion-deep. */
  vermilionDeep: '#C44536',
  /** Mirror of --color-ink (warm off-cream — body-text foreground). */
  ink: '#ECE4D2',
  /** Mirror of --color-graph-ink (SVG strokes equivalent). */
  graphInk: '#D5CEBF',
  /** Mirror of --color-graph-fade (grid lines, secondary strokes). */
  graphFade: '#3A352D',
  /** Mirror of --color-dim. */
  dim: '#8E8675',
} as const
