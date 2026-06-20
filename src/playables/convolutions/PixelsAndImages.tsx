import { useCallback, useRef } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import {
  VIEW_W,
  VIEW_H,
  IMG_SIZE,
  IMAGE_THREE,
  fmt2,
  pixelFill,
} from './conv'

/**
 * Act 2 — what's an image to a computer?
 *
 *  Left  : the 12×12 image rendered as little square pixels — a hand-drawn
 *          "3". The hovered/selected pixel pulses in vermilion.
 *  Right : the same image as a grid of numerical intensities. The selected
 *          cell's number lights up.
 *
 * Co-mutating: a single (row, col) cursor drives both panes. Click on either
 * side to move the cursor; arrow keys nudge.
 */

export interface PixelState {
  row: number
  col: number
  interacting: boolean
}

export const INITIAL_PIXEL: PixelState = { row: 5, col: 6, interacting: false }

const PAD = 50
const GRID_W = VIEW_W - 2 * PAD
const CELL = GRID_W / IMG_SIZE
const GRID_TOP = (VIEW_H - GRID_W) / 2 + 6

const clampCoord = (n: number) => Math.max(0, Math.min(IMG_SIZE - 1, n))

function CoordReadout({
  row,
  col,
  value,
}: {
  row: number
  col: number
  value: number
}) {
  return (
    <g transform="translate(40, 36)">
      <text
        fontFamily="Inter, sans-serif"
        fontSize="10"
        letterSpacing="0.22em"
        fill="var(--color-dim)"
      >
        PIXEL · ROW · COL
      </text>
      <text
        y="22"
        fontFamily="JetBrains Mono, monospace"
        fontSize="14"
        fill="var(--color-ink)"
      >
        ({row}, {col})
      </text>
      <text
        y="42"
        fontFamily="JetBrains Mono, monospace"
        fontSize="12"
        fill="var(--color-vermilion)"
      >
        intensity = {fmt2(value).trim()}
      </text>
    </g>
  )
}

function PixelGrid({
  selRow,
  selCol,
  onSelect,
  svgRef,
  cursorRef,
}: {
  selRow: number
  selCol: number
  onSelect: (r: number, c: number, interacting: boolean) => void
  svgRef: React.RefObject<SVGSVGElement | null>
  cursorRef: React.RefObject<SVGGElement | null>
}) {
  const handleSvgClick = useCallback(
    (evt: React.MouseEvent<SVGRectElement>) => {
      const rect = svgRef.current?.getBoundingClientRect()
      if (!rect) return
      const sx = VIEW_W / rect.width
      const sy = VIEW_H / rect.height
      const xSvg = (evt.clientX - rect.left) * sx
      const ySvg = (evt.clientY - rect.top) * sy
      const c = clampCoord(Math.floor((xSvg - PAD) / CELL))
      const r = clampCoord(Math.floor((ySvg - GRID_TOP) / CELL))
      onSelect(r, c, false)
    },
    [onSelect, svgRef],
  )

  return (
    <g>
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

      {/* Click hit-box covers the whole grid */}
      <rect
        x={PAD}
        y={GRID_TOP}
        width={GRID_W}
        height={GRID_W}
        fill="transparent"
        onClick={handleSvgClick}
        style={{ cursor: 'crosshair' }}
      />

      {/* Selection cursor */}
      <g
        ref={cursorRef}
        tabIndex={0}
        role="grid"
        aria-label={`Image pixel cursor. Row ${selRow + 1}, column ${selCol + 1}. Arrow keys to move.`}
        className="focus-visible:outline-none [&:focus-visible_.cursor-box]:stroke-vermilion-deep"
      >
        <rect
          className="cursor-box"
          x={PAD + selCol * CELL - 1}
          y={GRID_TOP + selRow * CELL - 1}
          width={CELL + 2}
          height={CELL + 2}
          fill="none"
          stroke="var(--color-vermilion)"
          strokeWidth="2"
        />
      </g>
    </g>
  )
}

/* ============================================================== */
/* LEFT PANE — picture                                             */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: PixelState
  onChange: (s: PixelState) => void
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const cursorRef = useRef<SVGGElement | null>(null)

  const update = useCallback(
    (r: number, c: number, interacting: boolean) =>
      onChange({ row: clampCoord(r), col: clampCoord(c), interacting }),
    [onChange],
  )

  useKeyNudge(
    cursorRef,
    useCallback(
      (dx: number, dy: number) => {
        // dy positive = up arrow → row decreases.
        const dRow = -Math.sign(dy)
        const dCol = Math.sign(dx)
        update(state.row + dRow, state.col + dCol, false)
      },
      [state.row, state.col, update],
    ),
  )

  const value = IMAGE_THREE[state.row][state.col]

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`A hand-drawn digit three on a 12 by 12 grid. The cursor sits at row ${state.row + 1}, column ${state.col + 1}, where the intensity is ${fmt2(value).trim()}. Zero is paper, one is ink.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A 12 by 12 grayscale image of a hand-drawn three. Selected pixel at row ${state.row + 1}, column ${state.col + 1}, intensity ${fmt2(value).trim()}.`}
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
          AN IMAGE · 12 × 12 PIXELS · GRAYSCALE
        </text>

        <PixelGrid
          selRow={state.row}
          selCol={state.col}
          onSelect={update}
          svgRef={svgRef}
          cursorRef={cursorRef}
        />

        <CoordReadout row={state.row} col={state.col} value={value} />

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 18}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          CLICK OR ARROWS · MOVE CURSOR
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1a &mdash; The image as we see it
      </figcaption>
    </figure>
  )
}

/* ============================================================== */
/* RIGHT PANE — numbers                                            */
/* ============================================================== */

export function RightPane({
  state,
  onChange,
}: {
  state: PixelState
  onChange: (s: PixelState) => void
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const cursorRef = useRef<SVGGElement | null>(null)

  const update = useCallback(
    (r: number, c: number, interacting: boolean) =>
      onChange({ row: clampCoord(r), col: clampCoord(c), interacting }),
    [onChange],
  )

  useKeyNudge(
    cursorRef,
    useCallback(
      (dx: number, dy: number) => {
        const dRow = -Math.sign(dy)
        const dCol = Math.sign(dx)
        update(state.row + dRow, state.col + dCol, false)
      },
      [state.row, state.col, update],
    ),
  )

  const handleSvgClick = useCallback(
    (evt: React.MouseEvent<SVGRectElement>) => {
      const rect = svgRef.current?.getBoundingClientRect()
      if (!rect) return
      const sx = VIEW_W / rect.width
      const sy = VIEW_H / rect.height
      const xSvg = (evt.clientX - rect.left) * sx
      const ySvg = (evt.clientY - rect.top) * sy
      const c = clampCoord(Math.floor((xSvg - PAD) / CELL))
      const r = clampCoord(Math.floor((ySvg - GRID_TOP) / CELL))
      update(r, c, false)
    },
    [update],
  )

  const value = IMAGE_THREE[state.row][state.col]

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`The same image as a grid of numbers. Each cell is an intensity from zero to one. The highlighted cell at row ${state.row + 1}, column ${state.col + 1} reads ${fmt2(value).trim()}.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A 12 by 12 grid of numerical intensities representing the same digit. Selected cell value ${fmt2(value).trim()}.`}
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
          AN IMAGE · 144 NUMBERS · INTENSITIES
        </text>

        {/* Grid cells with numerical labels */}
        {IMAGE_THREE.map((row, r) =>
          row.map((v, c) => {
            const isSel = r === state.row && c === state.col
            return (
              <g key={`n-${r}-${c}`}>
                <rect
                  x={PAD + c * CELL}
                  y={GRID_TOP + r * CELL}
                  width={CELL}
                  height={CELL}
                  fill={isSel ? '#fff4ef' : 'var(--color-cream)'}
                  stroke="var(--color-graph-fade)"
                  strokeWidth="0.5"
                />
                <text
                  x={PAD + c * CELL + CELL / 2}
                  y={GRID_TOP + r * CELL + CELL / 2 + 3}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize={CELL > 28 ? 9 : 8}
                  fill={
                    isSel
                      ? 'var(--color-vermilion)'
                      : v > 0.5
                        ? 'var(--color-ink)'
                        : 'var(--color-dim)'
                  }
                >
                  {v === 0 ? '·' : v.toFixed(1).slice(1)}
                </text>
              </g>
            )
          }),
        )}

        {/* Click hit-box */}
        <rect
          x={PAD}
          y={GRID_TOP}
          width={GRID_W}
          height={GRID_W}
          fill="transparent"
          onClick={handleSvgClick}
          style={{ cursor: 'crosshair' }}
        />

        {/* Selection cursor on the numbers */}
        <g
          ref={cursorRef}
          tabIndex={0}
          role="grid"
          aria-label={`Number-grid cursor. Row ${state.row + 1}, column ${state.col + 1}.`}
          className="focus-visible:outline-none [&:focus-visible_.cursor-box]:stroke-vermilion-deep"
        >
          <rect
            className="cursor-box"
            x={PAD + state.col * CELL - 1}
            y={GRID_TOP + state.row * CELL - 1}
            width={CELL + 2}
            height={CELL + 2}
            fill="none"
            stroke="var(--color-vermilion)"
            strokeWidth="2"
          />
        </g>

        <CoordReadout row={state.row} col={state.col} value={value} />

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 18}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          to a computer, the picture is the table
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1b &mdash; The image as the computer sees it
      </figcaption>
    </figure>
  )
}
