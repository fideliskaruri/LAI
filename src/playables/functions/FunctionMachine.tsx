import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Input → output, the function as a machine. A horizontal scrubber on the
 * x-axis is the input. As you drag it, a needle on the y-axis tracks the
 * matching output of f(x) = 2x + 1. The vermilion line is the graph of f;
 * the dashed L from input to needle is the *correspondence itself* —
 * the thing you can't draw without an interaction.
 *
 * Keyboard: arrow keys nudge x by 0.1; Shift+arrow by 1.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 260
const UNIT = 50

const X_MIN = -4
const X_MAX = 4

const fmt = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(2)

// The function under study.
const f = (x: number) => 2 * x + 1

export function FunctionMachine() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const [x, setX] = useState(0.7)
  const startXRef = useRef<number | null>(null)

  const updateX = useCallback((next: number) => {
    const clamped = Math.max(X_MIN, Math.min(X_MAX, next))
    const snap = Math.round(clamped)
    setX(Math.abs(clamped - snap) < 0.04 ? snap : clamped)
  }, [])

  const bind = useDrag(({ first, movement: [mx] }) => {
    if (first) startXRef.current = x
    const start = startXRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    updateX(start + (mx * sx) / UNIT)
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const step = Math.abs(dx) >= 10 ? Math.sign(dx) * 1 : Math.sign(dx) * 0.1
        updateX(x + step)
      },
      [x, updateX],
    ),
  )

  const y = f(x)

  // Pixel positions
  const inputSvgX = ORIGIN_X + x * UNIT
  const outputSvgY = ORIGIN_Y - y * UNIT
  const corner = { x: inputSvgX, y: outputSvgY }

  // Function-line endpoints clipped to the visible range so it doesn't
  // run off the panel.
  const lineStart = { x: ORIGIN_X + X_MIN * UNIT, y: ORIGIN_Y - f(X_MIN) * UNIT }
  const lineEnd = { x: ORIGIN_X + X_MAX * UNIT, y: ORIGIN_Y - f(X_MAX) * UNIT }

  const narrationText = `Input x equals ${fmt(x).trim()}. Output f of x equals ${fmt(y).trim()}.`

  return (
    <figure className="w-full">
      <CanvasNarrative text={narrationText} />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Function machine. The function is f of x equals 2 x plus 1. Input x equals ${fmt(x).trim()}, output equals ${fmt(y).trim()}. Drag the input scrubber on the x-axis.`}
      >
        <Grid />
        <Axes />

        {/* The graph of f(x) = 2x + 1 (vermilion line). */}
        <line
          x1={lineStart.x}
          y1={lineStart.y}
          x2={lineEnd.x}
          y2={lineEnd.y}
          stroke="var(--color-vermilion)"
          strokeWidth="2"
        />

        {/* Dashed L from input → corner → output: the correspondence. */}
        <line
          x1={inputSvgX}
          y1={ORIGIN_Y}
          x2={corner.x}
          y2={corner.y}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.55"
        />
        <line
          x1={corner.x}
          y1={corner.y}
          x2={ORIGIN_X}
          y2={outputSvgY}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.55"
        />

        {/* Needle on the y-axis (output indicator) */}
        <g>
          <line
            x1={ORIGIN_X - 8}
            y1={outputSvgY}
            x2={ORIGIN_X + 8}
            y2={outputSvgY}
            stroke="var(--color-vermilion)"
            strokeWidth="2.5"
          />
          <text
            x={ORIGIN_X - 14}
            y={outputSvgY + 4}
            textAnchor="end"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11"
            fill="var(--color-vermilion)"
          >
            {fmt(y).trim()}
          </text>
        </g>

        {/* Point on the curve at (x, f(x)) */}
        <circle cx={corner.x} cy={corner.y} r="5" fill="var(--color-vermilion)" />

        {/* Input scrubber on the x-axis */}
        <g
          {...bind()}
          ref={handleRef}
          tabIndex={0}
          role="slider"
          aria-label={`Input x. Current value ${fmt(x).trim()}. Arrow keys to nudge; Shift plus arrow to step by 1.`}
          aria-valuemin={X_MIN}
          aria-valuemax={X_MAX}
          aria-valuenow={Number(x.toFixed(2))}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={inputSvgX} cy={ORIGIN_Y} r="22" fill="transparent" />
          <circle
            cx={inputSvgX}
            cy={ORIGIN_Y}
            r="8"
            fill="var(--color-cream)"
            stroke="var(--color-vermilion)"
            strokeWidth="2"
          />
        </g>
        <text
          x={inputSvgX}
          y={ORIGIN_Y + 32}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fill="var(--color-vermilion)"
        >
          {fmt(x).trim()}
        </text>

        {/* Axis labels */}
        <text x="42" y={ORIGIN_Y - 12} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          OUTPUT
        </text>
        <text x={VIEW_W - 62} y={ORIGIN_Y + 22} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          INPUT
        </text>

        {/* Readout */}
        <g transform="translate(36, 36)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            THE MACHINE
          </text>
          <text y="22" fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-ink)">
            f(x) = 2x + 1
          </text>
          <text y="44" fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-vermilion)">
            f({fmt(x).trim()}) = {fmt(y).trim()}
          </text>
        </g>

        <text
          x="32"
          y={VIEW_H - 18}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          DRAG THE SCRUBBER  ·  ARROWS NUDGE  ·  ONE INPUT, ONE OUTPUT
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1 — A function: one number in, one number out.
      </figcaption>
    </figure>
  )
}

function Grid() {
  return (
    <>
      {Array.from({ length: 13 }, (_, i) => {
        const gx = ORIGIN_X + (i - 6) * UNIT
        return (
          <line key={`v-${i}`} x1={gx} y1="20" x2={gx} y2={VIEW_H - 60} stroke="var(--color-graph-fade)" strokeWidth="0.5" />
        )
      })}
      {Array.from({ length: 9 }, (_, i) => {
        const gy = ORIGIN_Y + (i - 4) * UNIT
        return (
          <line key={`h-${i}`} x1="20" y1={gy} x2={VIEW_W - 20} y2={gy} stroke="var(--color-graph-fade)" strokeWidth="0.5" />
        )
      })}
    </>
  )
}

function Axes() {
  return (
    <>
      <line x1="20" y1={ORIGIN_Y} x2={VIEW_W - 20} y2={ORIGIN_Y} stroke="var(--color-graph-ink)" strokeWidth="1" />
      <line x1={ORIGIN_X} y1="20" x2={ORIGIN_X} y2={VIEW_H - 60} stroke="var(--color-graph-ink)" strokeWidth="1" />
      <text x={VIEW_W - 30} y={ORIGIN_Y - 8} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-graph-ink)">x</text>
      <text x={ORIGIN_X + 8} y="30" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-graph-ink)">f(x)</text>
    </>
  )
}
