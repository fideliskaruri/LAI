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
  convolve,
  presentFeatureMap,
  convAt,
  pixelFill,
  featureFill,
  fmt2,
} from './conv'
import { KERNEL_SIZE, MAX_R, type KernelPosState } from './TheKernel'

/**
 * Act 4 — multiply, sum, slide.
 *
 *  Left  : same draggable kernel overlay from Act 3, but smaller so we can fit
 *          a side panel showing the live arithmetic of the multiply-and-sum.
 *  Right : the full feature map (an (IMG_SIZE - 2) × (IMG_SIZE - 2) grid) for
 *          the same vertical-edge Sobel kernel. The cell corresponding to the
 *          kernel's current position is highlighted in vermilion, with its
 *          exact value printed inside.
 *
 * Left-drives-right: the kernel position propagates to the right pane, which
 * is a derived view of the feature map and the chosen cell.
 */

export const INITIAL_CONV_POS: KernelPosState = {
  row: 4,
  col: 4,
  interacting: false,
}

const clampPos = (n: number) => Math.max(0, Math.min(MAX_R, n))

const ACTIVE = KERNEL_BY_ID['edge-vertical']

const PAD = 50
const GRID_W = VIEW_W - 2 * PAD
const CELL = GRID_W / IMG_SIZE
const GRID_TOP = (VIEW_H - GRID_W) / 2 + 6

const FMAP_SIZE = IMG_SIZE - KERNEL_SIZE + 1
const FCELL = GRID_W / FMAP_SIZE
const FGRID_TOP = (VIEW_H - GRID_W) / 2 + 6

/* ============================================================== */
/* LEFT PANE — draggable kernel + arithmetic readout               */
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
  const raw = convAt(IMAGE_THREE, ACTIVE.K, state.row, state.col)
  const shown = Math.max(
    0,
    Math.min(1, raw * (ACTIVE.scale ?? 1) + (ACTIVE.bias ?? 0)),
  )

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Drag the kernel. At its current position, row ${state.row + 1} column ${state.col + 1}, the kernel times patch sum equals ${fmt2(raw).trim()}. After scaling for display, the corresponding output cell on the right reads ${fmt2(shown).trim()}.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Image with draggable kernel. Raw output ${fmt2(raw).trim()} at row ${state.row + 1}, column ${state.col + 1}.`}
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
          MULTIPLY · SUM · SLIDE
        </text>

        {/* Image pixels */}
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

        {/* Kernel overlay */}
        <g
          {...bind()}
          ref={handleRef}
          tabIndex={0}
          role="slider"
          aria-label={`Kernel position. Row ${state.row + 1}, column ${state.col + 1}. Convolution value ${fmt2(raw).trim()}.`}
          aria-valuemin={0}
          aria-valuemax={MAX_R * (MAX_R + 1) + MAX_R}
          aria-valuenow={state.row * (MAX_R + 1) + state.col}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_.kframe]:stroke-vermilion-deep"
        >
          <rect
            x={overlayX}
            y={overlayY}
            width={KERNEL_SIZE * CELL}
            height={KERNEL_SIZE * CELL}
            fill="var(--color-vermilion)"
            fillOpacity="0.14"
          />
          <rect
            className="kframe"
            x={overlayX - 1}
            y={overlayY - 1}
            width={KERNEL_SIZE * CELL + 2}
            height={KERNEL_SIZE * CELL + 2}
            fill="none"
            stroke="var(--color-vermilion)"
            strokeWidth="2.4"
          />
        </g>

        {/* Arithmetic readout — bottom strip */}
        <g transform={`translate(40, ${VIEW_H - 76})`}>
          <text
            fontFamily="Inter, sans-serif"
            fontSize="9"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            CONVOLUTION AT THIS POSITION
          </text>
          <text
            y="18"
            fontFamily="JetBrains Mono, monospace"
            fontSize="12"
            fill="var(--color-ink)"
          >
            out({state.row}, {state.col}) = Σ K · patch = {fmt2(raw)}
          </text>
          <text
            y="36"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11"
            fill="var(--color-vermilion)"
          >
            display = clamp({fmt2(raw)} · {ACTIVE.scale} + {ACTIVE.bias}) = {fmt2(shown)}
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
          DRAG · ARROWS NUDGE · WATCH FEATURE MAP
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3a &mdash; The kernel slides across the image
      </figcaption>
    </figure>
  )
}

/* ============================================================== */
/* RIGHT PANE — feature map with active cell highlighted           */
/* ============================================================== */

export function RightPane({ state }: { state: KernelPosState }) {
  const raw = convolve(IMAGE_THREE, ACTIVE.K)
  const fmap = presentFeatureMap(raw, ACTIVE.scale ?? 1, ACTIVE.bias ?? 0)
  const cellRow = state.row
  const cellCol = state.col

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`The output of the convolution — the feature map. The highlighted cell, at row ${cellRow + 1} column ${cellCol + 1}, is the one currently driven by the kernel on the left. Vertical edges show up as the bright vermilion cells along the digit's strokes.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`The convolution feature map, ${FMAP_SIZE} by ${FMAP_SIZE}. Active output cell at row ${cellRow + 1}, column ${cellCol + 1}.`}
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
          FEATURE MAP · {FMAP_SIZE} × {FMAP_SIZE}
        </text>

        {/* Feature-map cells */}
        {fmap.map((row, r) =>
          row.map((v, c) => {
            const isSel = r === cellRow && c === cellCol
            return (
              <g key={`f-${r}-${c}`}>
                <rect
                  x={PAD + c * FCELL}
                  y={FGRID_TOP + r * FCELL}
                  width={FCELL}
                  height={FCELL}
                  fill={featureFill(v)}
                  stroke={isSel ? 'var(--color-vermilion)' : 'var(--color-graph-fade)'}
                  strokeWidth={isSel ? 2 : 0.5}
                />
                {isSel && (
                  <text
                    x={PAD + c * FCELL + FCELL / 2}
                    y={FGRID_TOP + r * FCELL + FCELL / 2 + 4}
                    textAnchor="middle"
                    fontFamily="JetBrains Mono, monospace"
                    fontSize={FCELL > 30 ? 11 : 9}
                    fill={v > 0.55 ? 'var(--color-cream)' : 'var(--color-ink)'}
                  >
                    {fmt2(v).trim()}
                  </text>
                )}
              </g>
            )
          }),
        )}

        {/* Position readout */}
        <g transform="translate(40, 36)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            OUTPUT CELL · DRIVEN BY KERNEL
          </text>
          <text
            y="22"
            fontFamily="JetBrains Mono, monospace"
            fontSize="14"
            fill="var(--color-vermilion)"
          >
            ({cellRow}, {cellCol}) = {fmt2(fmap[cellRow][cellCol])}
          </text>
        </g>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 36}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          one number per position — the kernel&rsquo;s opinion
        </text>
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 16}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          THE WHOLE GRID IS THE CONVOLUTION
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3b &mdash; The feature map fills in, one cell per position
      </figcaption>
    </figure>
  )
}
