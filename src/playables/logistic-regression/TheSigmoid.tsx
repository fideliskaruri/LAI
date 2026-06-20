import { useCallback, useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import {
  VIEW_W,
  VIEW_H,
  PLOT_X0,
  PLOT_X1,
  PLOT_Y0,
  PLOT_Y1,
  sigmoid,
} from './dataset'

/**
 * Act 2 — squashing real numbers into probabilities.
 *
 *  Left  : a real-number line with a single draggable z value, marked from
 *          −6 to +6. Drag it; the right pane follows.
 *  Right : the sigmoid curve σ(z) = 1/(1 + e^(−z)) plotted on the same z
 *          range, with a vermilion marker at (z, σ(z)). As z slides, the
 *          marker slides along the curve and the output reads off.
 *
 * Co-mutating: both panes share the same SigmoidState object so dragging on
 * either side updates the other.
 */

export interface SigmoidState {
  z: number
  interacting: boolean
}

export const INITIAL_SIGMOID: SigmoidState = { z: 0, interacting: false }

const Z_MIN = -6
const Z_MAX = 6

const fmt1 = (n: number) => n.toFixed(1)
const fmt3 = (n: number) => n.toFixed(3)

function zToPx(z: number) {
  return PLOT_X0 + ((z - Z_MIN) / (Z_MAX - Z_MIN)) * (PLOT_X1 - PLOT_X0)
}
function pxToZ(px: number) {
  return Z_MIN + ((px - PLOT_X0) / (PLOT_X1 - PLOT_X0)) * (Z_MAX - Z_MIN)
}
function sigmaToPx(s: number) {
  // σ in [0,1] → pixel y. Reserve a margin so 0 and 1 are inside the frame.
  const TOP = PLOT_Y0 + 24
  const BOT = PLOT_Y1 - 24
  return BOT - s * (BOT - TOP)
}

/* ============================================================== */
/* LEFT PANE — the number line                                     */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: SigmoidState
  onChange: (s: SigmoidState) => void
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const startZRef = useRef<number | null>(null)

  const update = useCallback(
    (z: number, interacting: boolean) => {
      const clamped = Math.max(Z_MIN, Math.min(Z_MAX, z))
      onChange({ z: clamped, interacting })
    },
    [onChange],
  )

  const bind = useDrag(({ first, last, movement: [mx] }) => {
    if (first) startZRef.current = state.z
    const start = startZRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const startPx = zToPx(start)
    const newPx = startPx + mx * sx
    update(pxToZ(newPx), !last)
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const step = Math.abs(dx) >= 10 ? 1 : 0.1
        update(state.z + Math.sign(dx) * step, false)
      },
      [state.z, update],
    ),
  )

  const handleX = zToPx(state.z)
  const lineY = (PLOT_Y0 + PLOT_Y1) / 2

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Real number z equals ${fmt1(state.z)}. Drag the marker along the line between minus six and plus six.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A draggable real-number line. Current z equals ${fmt1(state.z)}.`}
      >
        {/* Frame */}
        <rect
          x="40"
          y="40"
          width={VIEW_W - 80}
          height={VIEW_H - 80}
          fill="none"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        <text
          x={VIEW_W / 2}
          y="80"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          A REAL NUMBER &middot; z ∈ ℝ
        </text>

        {/* The number line itself */}
        <line
          x1={PLOT_X0}
          y1={lineY}
          x2={PLOT_X1}
          y2={lineY}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.2"
        />

        {/* Arrowheads at the ends suggesting it goes to ±∞ */}
        <polygon
          points={`${PLOT_X0 - 6},${lineY} ${PLOT_X0 + 6},${lineY - 5} ${PLOT_X0 + 6},${lineY + 5}`}
          fill="var(--color-graph-ink)"
        />
        <polygon
          points={`${PLOT_X1 + 6},${lineY} ${PLOT_X1 - 6},${lineY - 5} ${PLOT_X1 - 6},${lineY + 5}`}
          fill="var(--color-graph-ink)"
        />

        {/* Tick marks at integers */}
        {[-6, -4, -2, 0, 2, 4, 6].map((t) => (
          <g key={t}>
            <line
              x1={zToPx(t)}
              y1={lineY - 6}
              x2={zToPx(t)}
              y2={lineY + 6}
              stroke="var(--color-graph-ink)"
              strokeWidth="1"
            />
            <text
              x={zToPx(t)}
              y={lineY + 24}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="11"
              fill="var(--color-dim)"
            >
              {t}
            </text>
          </g>
        ))}

        {/* Arrow labels for ±∞ */}
        <text
          x={PLOT_X0 - 14}
          y={lineY + 4}
          textAnchor="end"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          &minus;&infin;
        </text>
        <text
          x={PLOT_X1 + 14}
          y={lineY + 4}
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          +&infin;
        </text>

        {/* The draggable handle */}
        <g
          {...bind()}
          ref={handleRef}
          tabIndex={0}
          role="slider"
          aria-label={`Real number z. Current ${fmt1(state.z)}. Arrow keys to nudge, Shift plus arrow to step by 1.`}
          aria-valuemin={Z_MIN}
          aria-valuemax={Z_MAX}
          aria-valuenow={Number(state.z.toFixed(1))}
          style={{ cursor: 'ew-resize', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={handleX} cy={lineY} r="22" fill="transparent" />
          <line
            x1={handleX}
            y1={lineY - 36}
            x2={handleX}
            y2={lineY + 36}
            stroke="var(--color-vermilion)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
          <circle
            cx={handleX}
            cy={lineY}
            r="9"
            fill="var(--color-vermilion)"
            stroke="var(--color-cream)"
            strokeWidth="2"
          />
        </g>

        {/* Readout above the line */}
        <g transform={`translate(${handleX}, ${lineY - 60})`}>
          <rect
            x="-36"
            y="-20"
            width="72"
            height="24"
            fill="var(--color-cream)"
            stroke="var(--color-vermilion)"
            strokeWidth="1"
          />
          <text
            y="-3"
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="12"
            fill="var(--color-vermilion)"
          >
            z = {fmt1(state.z)}
          </text>
        </g>

        <text
          x={PLOT_X1 - 6}
          y={PLOT_Y1 + 40}
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          DRAG &middot; ARROWS NUDGE
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1a &mdash; A real number on a real line
      </figcaption>
    </figure>
  )
}

/* ============================================================== */
/* RIGHT PANE — the sigmoid curve                                  */
/* ============================================================== */

export function RightPane({
  state,
  onChange,
}: {
  state: SigmoidState
  onChange: (s: SigmoidState) => void
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const startZRef = useRef<number | null>(null)

  const update = useCallback(
    (z: number, interacting: boolean) => {
      const clamped = Math.max(Z_MIN, Math.min(Z_MAX, z))
      onChange({ z: clamped, interacting })
    },
    [onChange],
  )

  const bind = useDrag(({ first, last, movement: [mx] }) => {
    if (first) startZRef.current = state.z
    const start = startZRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const startPx = zToPx(start)
    const newPx = startPx + mx * sx
    update(pxToZ(newPx), !last)
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const step = Math.abs(dx) >= 10 ? 1 : 0.1
        update(state.z + Math.sign(dx) * step, false)
      },
      [state.z, update],
    ),
  )

  // Build the sigmoid curve path
  const N = 160
  const pts: string[] = []
  for (let i = 0; i <= N; i++) {
    const z = Z_MIN + ((Z_MAX - Z_MIN) * i) / N
    const s = sigmoid(z)
    const px = zToPx(z)
    const py = sigmaToPx(s)
    pts.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(2)} ${py.toFixed(2)}`)
  }
  const path = pts.join(' ')

  const sigma = sigmoid(state.z)
  const hx = zToPx(state.z)
  const hy = sigmaToPx(sigma)

  // Labels for special σ values
  const y0 = sigmaToPx(0)
  const y1 = sigmaToPx(1)
  const yhalf = sigmaToPx(0.5)

  // Narration: high priority when sigma is essentially 0 or 1 or 0.5
  const milestone =
    Math.abs(sigma - 0.5) < 0.02
      ? 'half'
      : sigma > 0.98
        ? 'one'
        : sigma < 0.02
          ? 'zero'
          : null
  const narration =
    milestone === 'half'
      ? `At z equals zero, sigma equals one half — the midpoint of the curve.`
      : milestone === 'one'
        ? `Sigma is essentially one. The curve is saturating.`
        : milestone === 'zero'
          ? `Sigma is essentially zero. The curve is saturating.`
          : `z equals ${fmt1(state.z)}, sigma equals ${fmt3(sigma)}.`
  const priority: 'normal' | 'high' = milestone ? 'high' : 'normal'

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration} priority={priority} isInteracting={state.interacting} />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`The sigmoid curve. Marker at z equals ${fmt1(state.z)}, sigma equals ${fmt3(sigma)}.`}
      >
        {/* Frame */}
        <rect
          x="40"
          y="40"
          width={VIEW_W - 80}
          height={VIEW_H - 80}
          fill="none"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        {/* Horizontal guide lines for 0, 0.5, 1 */}
        {[
          { y: y0, label: '0' },
          { y: yhalf, label: '½' },
          { y: y1, label: '1' },
        ].map((g) => (
          <g key={g.label}>
            <line
              x1={PLOT_X0}
              y1={g.y}
              x2={PLOT_X1}
              y2={g.y}
              stroke="var(--color-graph-fade)"
              strokeWidth="0.6"
              strokeDasharray={g.label === '½' ? '3 3' : undefined}
            />
            <text
              x={PLOT_X0 - 8}
              y={g.y + 3}
              textAnchor="end"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
            >
              {g.label}
            </text>
          </g>
        ))}

        {/* x-axis with z ticks (centered around zero) */}
        <line
          x1={PLOT_X0}
          y1={y0}
          x2={PLOT_X1}
          y2={y0}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
        />
        {[-6, -4, -2, 0, 2, 4, 6].map((t) => (
          <g key={t}>
            <line
              x1={zToPx(t)}
              y1={y0}
              x2={zToPx(t)}
              y2={y0 + 4}
              stroke="var(--color-graph-ink)"
              strokeWidth="1"
            />
            <text
              x={zToPx(t)}
              y={y0 + 18}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
            >
              {t}
            </text>
          </g>
        ))}

        {/* Axis labels */}
        <text
          x={(PLOT_X0 + PLOT_X1) / 2}
          y={y0 + 40}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          z
        </text>
        <text
          x={PLOT_X0 - 44}
          y={(PLOT_Y0 + PLOT_Y1) / 2}
          transform={`rotate(-90, ${PLOT_X0 - 44}, ${(PLOT_Y0 + PLOT_Y1) / 2})`}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          σ(z)
        </text>

        {/* The curve */}
        <path d={path} fill="none" stroke="var(--color-graph-ink)" strokeWidth="1.8" />

        {/* Crosshairs from axes to the marker */}
        <line
          x1={hx}
          y1={y0}
          x2={hx}
          y2={hy}
          stroke="var(--color-vermilion)"
          strokeOpacity="0.5"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <line
          x1={PLOT_X0}
          y1={hy}
          x2={hx}
          y2={hy}
          stroke="var(--color-vermilion)"
          strokeOpacity="0.5"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        {/* Marker — draggable along the curve via z */}
        <g
          {...bind()}
          ref={handleRef}
          tabIndex={0}
          role="slider"
          aria-label={`Sigmoid marker. z equals ${fmt1(state.z)}, sigma equals ${fmt3(sigma)}. Arrow keys to nudge z.`}
          aria-valuemin={Z_MIN}
          aria-valuemax={Z_MAX}
          aria-valuenow={Number(state.z.toFixed(1))}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={hx} cy={hy} r="22" fill="transparent" />
          <circle
            cx={hx}
            cy={hy}
            r="8"
            fill="var(--color-vermilion)"
            stroke="var(--color-cream)"
            strokeWidth="2"
          />
        </g>

        {/* Readout card */}
        <g transform={`translate(${PLOT_X0 + 12}, ${PLOT_Y0 + 14})`}>
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
            σ(z) = 1 / (1 + e^(−z))
          </text>
          <text y="20" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-ink)">
            σ({fmt1(state.z)}) = {fmt3(sigma)}
          </text>
        </g>

        <text
          x={PLOT_X1 - 6}
          y={PLOT_Y1 + 40}
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          ALWAYS BETWEEN 0 AND 1
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1b &mdash; The same number, squashed into a probability
      </figcaption>
    </figure>
  )
}
