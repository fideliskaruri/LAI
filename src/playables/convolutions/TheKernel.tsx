import { useCallback, useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import {
  VIEW_W,
  VIEW_H,
  IMG_SIZE,
  IMAGE_THREE,
  KERNEL_BY_ID,
  pixelFill,
  fmt2,
} from './conv'

/**
 * Act 3 — the kernel.
 *
 *  Left  : the same 12×12 image with a 3×3 vermilion overlay marking the
 *          kernel's current position. Drag the overlay anywhere it fits.
 *  Right : the 3×3 kernel weights as a small numeric matrix, plus the 3×3
 *          patch of image intensities currently sitting beneath the kernel.
 *          Both grids are aligned so the reader can compare cell-for-cell.
 *
 * left-drives-right: the kernel position lives on the left; the right is a
 * derived view of the patch underneath.
 */

export interface KernelPosState {
  /** Row of the kernel's top-left corner. */
  row: number
  /** Column of the kernel's top-left corner. */
  col: number
  interacting: boolean
}

export const KERNEL_SIZE = 3
export const MAX_R = IMG_SIZE - KERNEL_SIZE // inclusive max for top-left
export const INITIAL_KERNEL_POS: KernelPosState = {
  row: 4,
  col: 4,
  interacting: false,
}

const clampPos = (n: number) => Math.max(0, Math.min(MAX_R, n))

const PAD = 50
const GRID_W = VIEW_W - 2 * PAD
const CELL = GRID_W / IMG_SIZE
const GRID_TOP = (VIEW_H - GRID_W) / 2 + 6

// The single kernel this act demonstrates (vertical-edge Sobel).
const ACTIVE_KERNEL = KERNEL_BY_ID['edge-vertical']

/* ============================================================== */
/* LEFT PANE — image + draggable kernel overlay                    */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: KernelPosState
  onChange: (s: KernelPosState) => void
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const startRef = useRef<{ row: number; col: number } | null>(null)

  const update = useCallback(
    (row: number, col: number, interacting: boolean) =>
      onChange({ row: clampPos(row), col: clampPos(col), interacting }),
    [onChange],
  )

  const bind = useDrag(({ first, last, movement: [mx, my] }) => {
    if (first) startRef.current = { row: state.row, col: state.col }
    const start = startRef.current
    if (!start) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const sy = VIEW_H / rect.height
    const dCol = Math.round((mx * sx) / CELL)
    const dRow = Math.round((my * sy) / CELL)
    update(start.row + dRow, start.col + dCol, !last)
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number, dy: number) => {
        const dRow = -Math.sign(dy)
        const dCol = Math.sign(dx)
        update(state.row + dRow, state.col + dCol, false)
      },
      [state.row, state.col, update],
    ),
  )

  const overlayX = PAD + state.col * CELL
  const overlayY = GRID_TOP + state.row * CELL

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`A 3 by 3 kernel highlighted in vermilion, sitting on top of the digit at row ${state.row + 1}, column ${state.col + 1}. Drag the overlay to slide the kernel across the image.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`12 by 12 digit image with a draggable 3 by 3 kernel overlay positioned at row ${state.row + 1}, column ${state.col + 1}.`}
      >
        <text
          x={VIEW_W / 2}
          y="20"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          A 3 × 3 KERNEL · A LITTLE DETECTOR
        </text>

        {/* Pixels */}
        {IMAGE_THREE.map((row, r) =>
          row.map((v, c) => (
            <rect
              key={`p-${r}-${c}`}
              x={PAD + c * CELL}
              y={GRID_TOP + r * CELL}
              width={CELL}
              height={CELL}
              fill={pixelFill(v)}
              stroke="var(--color-graph-fade)"
              strokeWidth="0.5"
            />
          )),
        )}

        {/* Kernel overlay — vermilion outlined square covering the 3x3 patch */}
        <g
          {...bind()}
          ref={handleRef}
          tabIndex={0}
          role="slider"
          aria-label={`Kernel position. Row ${state.row + 1}, column ${state.col + 1} of ${MAX_R + 1}. Drag or arrow keys to move.`}
          aria-valuemin={0}
          aria-valuemax={MAX_R * (MAX_R + 1) + MAX_R}
          aria-valuenow={state.row * (MAX_R + 1) + state.col}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_.kernel-frame]:stroke-vermilion-deep"
        >
          {/* Translucent fill */}
          <rect
            x={overlayX}
            y={overlayY}
            width={KERNEL_SIZE * CELL}
            height={KERNEL_SIZE * CELL}
            fill="var(--color-vermilion)"
            fillOpacity="0.12"
          />
          {/* Frame */}
          <rect
            className="kernel-frame"
            x={overlayX - 1}
            y={overlayY - 1}
            width={KERNEL_SIZE * CELL + 2}
            height={KERNEL_SIZE * CELL + 2}
            fill="none"
            stroke="var(--color-vermilion)"
            strokeWidth="2.4"
          />
          {/* Internal kernel grid lines */}
          {[1, 2].map((k) => (
            <g key={`grid-${k}`}>
              <line
                x1={overlayX + k * CELL}
                y1={overlayY}
                x2={overlayX + k * CELL}
                y2={overlayY + KERNEL_SIZE * CELL}
                stroke="var(--color-vermilion)"
                strokeWidth="0.8"
                strokeOpacity="0.6"
              />
              <line
                x1={overlayX}
                y1={overlayY + k * CELL}
                x2={overlayX + KERNEL_SIZE * CELL}
                y2={overlayY + k * CELL}
                stroke="var(--color-vermilion)"
                strokeWidth="0.8"
                strokeOpacity="0.6"
              />
            </g>
          ))}
        </g>

        {/* Coord readout */}
        <g transform="translate(40, 36)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            KERNEL · TOP-LEFT · ROW · COL
          </text>
          <text
            y="22"
            fontFamily="JetBrains Mono, monospace"
            fontSize="14"
            fill="var(--color-vermilion)"
          >
            ({state.row}, {state.col})
          </text>
        </g>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 18}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          DRAG · ARROWS NUDGE · KERNEL SLIDES
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2a &mdash; A small window looking at a small patch
      </figcaption>
    </figure>
  )
}

/* ============================================================== */
/* RIGHT PANE — kernel weights + current patch                     */
/* ============================================================== */

export function RightPane({ state }: { state: KernelPosState }) {
  const K = ACTIVE_KERNEL.K
  // Pull out the 3x3 patch under the kernel.
  const patch: number[][] = []
  for (let u = 0; u < KERNEL_SIZE; u++) {
    const row: number[] = []
    for (let v = 0; v < KERNEL_SIZE; v++) {
      row.push(IMAGE_THREE[state.row + u][state.col + v])
    }
    patch.push(row)
  }

  const BIG_CELL = 56
  const KERNEL_TOP = 110
  const KERNEL_LEFT = (VIEW_W - 2 * KERNEL_SIZE * BIG_CELL - 60) / 2
  const PATCH_LEFT = KERNEL_LEFT + KERNEL_SIZE * BIG_CELL + 60

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`The 3 by 3 kernel weights on the left, the image patch currently beneath the kernel on the right. The kernel shown is a Sobel filter for vertical edges — positive on the right column, negative on the left, with a stronger middle row.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A 3 by 3 vertical-edge kernel and the corresponding 3 by 3 image patch.`}
      >
        <text
          x={VIEW_W / 2}
          y="40"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THE KERNEL · A 3 × 3 BANK OF WEIGHTS
        </text>
        <text
          x={VIEW_W / 2}
          y="62"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          {ACTIVE_KERNEL.name}
        </text>

        {/* Kernel grid */}
        <text
          x={KERNEL_LEFT + (KERNEL_SIZE * BIG_CELL) / 2}
          y={KERNEL_TOP - 14}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          KERNEL K
        </text>
        {K.map((row, r) =>
          row.map((v, c) => (
            <g key={`k-${r}-${c}`}>
              <rect
                x={KERNEL_LEFT + c * BIG_CELL}
                y={KERNEL_TOP + r * BIG_CELL}
                width={BIG_CELL}
                height={BIG_CELL}
                fill={
                  v > 0 ? '#fff0e7' : v < 0 ? '#f0eee9' : 'var(--color-cream)'
                }
                stroke="var(--color-vermilion)"
                strokeWidth="1.4"
              />
              <text
                x={KERNEL_LEFT + c * BIG_CELL + BIG_CELL / 2}
                y={KERNEL_TOP + r * BIG_CELL + BIG_CELL / 2 + 5}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="16"
                fill={
                  v > 0
                    ? 'var(--color-vermilion)'
                    : v < 0
                      ? 'var(--color-graph-ink)'
                      : 'var(--color-dim)'
                }
              >
                {v}
              </text>
            </g>
          )),
        )}

        {/* Patch grid */}
        <text
          x={PATCH_LEFT + (KERNEL_SIZE * BIG_CELL) / 2}
          y={KERNEL_TOP - 14}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          IMAGE PATCH
        </text>
        {patch.map((row, r) =>
          row.map((v, c) => (
            <g key={`pa-${r}-${c}`}>
              <rect
                x={PATCH_LEFT + c * BIG_CELL}
                y={KERNEL_TOP + r * BIG_CELL}
                width={BIG_CELL}
                height={BIG_CELL}
                fill={pixelFill(v)}
                stroke="var(--color-graph-ink)"
                strokeWidth="1"
              />
              <text
                x={PATCH_LEFT + c * BIG_CELL + BIG_CELL / 2}
                y={KERNEL_TOP + r * BIG_CELL + BIG_CELL / 2 + 5}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="13"
                fill={v > 0.5 ? 'var(--color-cream)' : 'var(--color-ink)'}
              >
                {fmt2(v).trim()}
              </text>
            </g>
          )),
        )}

        {/* Caption row */}
        <text
          x={VIEW_W / 2}
          y={KERNEL_TOP + KERNEL_SIZE * BIG_CELL + 56}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-ink)"
        >
          fixed weights · sliding patch
        </text>
        <text
          x={VIEW_W / 2}
          y={KERNEL_TOP + KERNEL_SIZE * BIG_CELL + 78}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          one detector, applied everywhere
        </text>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 36}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          NEXT · MULTIPLY · SUM · WRITE TO OUTPUT
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2b &mdash; The detector and the patch it&rsquo;s looking at
      </figcaption>
    </figure>
  )
}
