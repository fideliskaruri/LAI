import { useCallback, useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import {
  VIEW_W,
  VIEW_H,
  IMAGE_THREE,
  KERNEL_BY_ID,
  convolve,
  presentFeatureMap,
  maxPool2x2,
  featureFill,
  fmt2,
} from './conv'

/**
 * Act 6 — pooling.
 *
 *  Left  : the vertical-edge feature map from Act 4 with a draggable 2×2
 *          pooling window. The window shows the four cells under it and the
 *          max value of those four.
 *  Right : the full 2×2 max-pooled output (half the linear size, quarter the
 *          number of cells). The cell driven by the current pooling-window
 *          position is highlighted.
 *
 * Left-drives-right.
 */

export interface PoolState {
  /** Row of the pooling window's top-left, in INPUT coords. Always even. */
  row: number
  /** Column of the pooling window's top-left, in INPUT coords. Always even. */
  col: number
  interacting: boolean
}

export const INITIAL_POOL: PoolState = { row: 4, col: 4, interacting: false }

const ACTIVE = KERNEL_BY_ID['edge-vertical']

const PAD = 50
const GRID_W = VIEW_W - 2 * PAD

// Feature map from Act 4 — (10 x 10) for our 12x12 image with a 3x3 kernel.
const RAW_FMAP = convolve(IMAGE_THREE, ACTIVE.K)
const FMAP = presentFeatureMap(RAW_FMAP, ACTIVE.scale ?? 1, ACTIVE.bias ?? 0)
const FMAP_SIZE = FMAP.length // 10
// Make pool grid even so 2x2 pooling produces 5x5 output cleanly.
const POOL_INPUT_SIZE = FMAP_SIZE - (FMAP_SIZE % 2) // 10
const POOLED_SIZE = POOL_INPUT_SIZE / 2 // 5
const POOLED = maxPool2x2(
  FMAP.slice(0, POOL_INPUT_SIZE).map((row) => row.slice(0, POOL_INPUT_SIZE)),
)

const MAX_R = POOL_INPUT_SIZE - 2 // 8 — last legal top-left row/col, snapped to even

const FCELL = GRID_W / POOL_INPUT_SIZE
const FGRID_TOP = 110

const POOLED_CELL = GRID_W / POOLED_SIZE
const POOLED_TOP = 110

const snapEven = (n: number) => 2 * Math.round(n / 2)
const clampInput = (n: number) => Math.max(0, Math.min(MAX_R, snapEven(n)))

/* ============================================================== */
/* LEFT PANE — feature map + draggable 2x2 pool window             */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: PoolState
  onChange: (s: PoolState) => void
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const startRef = useRef<{ row: number; col: number } | null>(null)

  const update = useCallback(
    (row: number, col: number, interacting: boolean) =>
      onChange({ row: clampInput(row), col: clampInput(col), interacting }),
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
    const dCol = Math.round((mx * sx) / FCELL)
    const dRow = Math.round((my * sy) / FCELL)
    update(start.row + dRow, start.col + dCol, !last)
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number, dy: number) => {
        // Each arrow press moves by one pooled cell = 2 input cells.
        const dRow = -Math.sign(dy) * 2
        const dCol = Math.sign(dx) * 2
        update(state.row + dRow, state.col + dCol, false)
      },
      [state.row, state.col, update],
    ),
  )

  const overlayX = PAD + state.col * FCELL
  const overlayY = FGRID_TOP + state.row * FCELL

  const four = [
    FMAP[state.row][state.col],
    FMAP[state.row][state.col + 1],
    FMAP[state.row + 1][state.col],
    FMAP[state.row + 1][state.col + 1],
  ]
  const maxVal = Math.max(...four)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`A 2 by 2 pooling window over the feature map at row ${state.row + 1}, column ${state.col + 1}. The four cells beneath it read ${four.map((v) => fmt2(v).trim()).join(', ')}. Their maximum, ${fmt2(maxVal).trim()}, is the corresponding cell of the pooled output.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Feature map with a 2 by 2 max-pool window at row ${state.row + 1}, column ${state.col + 1}. Max value ${fmt2(maxVal).trim()}.`}
      >
        <text
          x={VIEW_W / 2}
          y="24"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          FEATURE MAP · 2 × 2 MAX-POOL WINDOW
        </text>

        {/* Map cells */}
        {Array.from({ length: POOL_INPUT_SIZE }).map((_, r) =>
          Array.from({ length: POOL_INPUT_SIZE }).map((_, c) => {
            const v = FMAP[r][c]
            return (
              <g key={`f-${r}-${c}`}>
                <rect
                  x={PAD + c * FCELL}
                  y={FGRID_TOP + r * FCELL}
                  width={FCELL}
                  height={FCELL}
                  fill={featureFill(v)}
                  stroke="var(--color-graph-fade)"
                  strokeWidth="0.5"
                />
                <text
                  x={PAD + c * FCELL + FCELL / 2}
                  y={FGRID_TOP + r * FCELL + FCELL / 2 + 3}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="8"
                  fill={v > 0.55 ? 'var(--color-cream)' : 'var(--color-ink)'}
                >
                  {v.toFixed(2).slice(1)}
                </text>
              </g>
            )
          }),
        )}

        {/* Pool window overlay */}
        <g
          {...bind()}
          ref={handleRef}
          tabIndex={0}
          role="slider"
          aria-label={`2 by 2 pool window. Row ${state.row + 1}, column ${state.col + 1}. Max ${fmt2(maxVal).trim()}.`}
          aria-valuemin={0}
          aria-valuemax={MAX_R * (POOLED_SIZE - 1) + MAX_R}
          aria-valuenow={state.row * POOLED_SIZE + state.col}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_.pframe]:stroke-vermilion-deep"
        >
          <rect
            x={overlayX}
            y={overlayY}
            width={2 * FCELL}
            height={2 * FCELL}
            fill="var(--color-vermilion)"
            fillOpacity="0.14"
          />
          <rect
            className="pframe"
            x={overlayX - 1}
            y={overlayY - 1}
            width={2 * FCELL + 2}
            height={2 * FCELL + 2}
            fill="none"
            stroke="var(--color-vermilion)"
            strokeWidth="2.4"
          />
        </g>

        {/* Arithmetic readout */}
        <g transform={`translate(${PAD}, ${FGRID_TOP + GRID_W + 24})`}>
          <text
            fontFamily="Inter, sans-serif"
            fontSize="9"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            FOUR CELLS · ONE MAX
          </text>
          <text
            y="22"
            fontFamily="JetBrains Mono, monospace"
            fontSize="12"
            fill="var(--color-ink)"
          >
            max({fmt2(four[0])}, {fmt2(four[1])}, {fmt2(four[2])}, {fmt2(four[3])})
          </text>
          <text
            y="40"
            fontFamily="JetBrains Mono, monospace"
            fontSize="12"
            fill="var(--color-vermilion)"
          >
            = {fmt2(maxVal)}
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
          DRAG · ARROWS NUDGE · WINDOW STEPS BY 2
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5a &mdash; The pool window slides across the feature map
      </figcaption>
    </figure>
  )
}

/* ============================================================== */
/* RIGHT PANE — pooled output (half size)                          */
/* ============================================================== */

export function RightPane({ state }: { state: PoolState }) {
  const poolRow = state.row / 2
  const poolCol = state.col / 2

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`The pooled output. The feature map shrank from ${POOL_INPUT_SIZE} by ${POOL_INPUT_SIZE} to ${POOLED_SIZE} by ${POOLED_SIZE}. The cell driven by the window's current position lights up at row ${poolRow + 1}, column ${poolCol + 1}.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`The max-pooled feature map, ${POOLED_SIZE} by ${POOLED_SIZE}. Active cell at row ${poolRow + 1}, column ${poolCol + 1}.`}
      >
        <text
          x={VIEW_W / 2}
          y="24"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          POOLED · {POOLED_SIZE} × {POOLED_SIZE} · 4× FEWER NUMBERS
        </text>

        {POOLED.map((row, r) =>
          row.map((v, c) => {
            const isSel = r === poolRow && c === poolCol
            return (
              <g key={`po-${r}-${c}`}>
                <rect
                  x={PAD + c * POOLED_CELL}
                  y={POOLED_TOP + r * POOLED_CELL}
                  width={POOLED_CELL}
                  height={POOLED_CELL}
                  fill={featureFill(v)}
                  stroke={isSel ? 'var(--color-vermilion)' : 'var(--color-graph-fade)'}
                  strokeWidth={isSel ? 2.4 : 0.5}
                />
                <text
                  x={PAD + c * POOLED_CELL + POOLED_CELL / 2}
                  y={POOLED_TOP + r * POOLED_CELL + POOLED_CELL / 2 + 5}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="13"
                  fill={v > 0.55 ? 'var(--color-cream)' : 'var(--color-ink)'}
                >
                  {fmt2(v).trim()}
                </text>
              </g>
            )
          }),
        )}

        {/* Why we pool */}
        <g transform={`translate(${PAD}, ${POOLED_TOP + GRID_W + 24})`}>
          <text
            fontFamily="Inter, sans-serif"
            fontSize="9"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            WHY POOL
          </text>
          <text
            y="22"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="13"
            fill="var(--color-ink)"
          >
            shrinks the data · gives position invariance
          </text>
          <text
            y="42"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="13"
            fill="var(--color-dim)"
          >
            the digit can move a pixel and the answer survives
          </text>
        </g>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 18}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          LOSSY · DELIBERATE · USEFUL
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5b &mdash; The pooled output, four times smaller
      </figcaption>
    </figure>
  )
}
