import { useCallback, useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import { PlotAxes } from './Axes'
import {
  VIEW_W,
  VIEW_H,
  PLOT_X0,
  PLOT_X1,
  PLOT_Y0,
  PLOT_Y1,
  PLOT_W,
  PLOT_H,
  X_MIN,
  X_MAX,
  Y_MIN,
  Y_MAX,
  dataToSvgX,
  dataToSvgY,
  boundaryEndpoints,
  preActivation,
  predict,
  INITIAL_WEIGHTS,
  type PerceptronWeights,
} from './dataset'

/**
 * Act 3 — forward pass. The reader drags a single input point through the
 * 2D feature space and watches the perceptron's output flip when the point
 * crosses the decision boundary.
 *
 *  Left  : the feature space with a fixed (illustrative) boundary and a
 *          draggable input point. The two half-planes are faintly tinted
 *          blue and red.
 *  Right : a "neuron diagram" — two input nodes labelled with the current
 *          x, y; weighted edges into a summing junction; an arrow into a
 *          step gate; an output reading 0 or 1 in real time.
 *
 * The weights are fixed in this act (not editable) so the reader focuses on
 * the FORWARD calculation. The next act introduces learning.
 *
 * Co-mutating state: ForwardState. Both panes share the same input point.
 */

export interface ForwardState {
  /** the draggable input point */
  px: number
  py: number
  interacting: boolean
}

export const INITIAL_FORWARD: ForwardState = {
  px: 0.3,
  py: -0.4,
  interacting: false,
}

/** Fixed illustrative weights for this act. */
const W: PerceptronWeights = INITIAL_WEIGHTS

const fmt2 = (n: number) => n.toFixed(2)
const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v))

/* ============================================================== */
/* LEFT PANE — feature space with the draggable point              */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: ForwardState
  onChange: (s: ForwardState) => void
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const startRef = useRef<{ px: number; py: number } | null>(null)

  const update = useCallback(
    (px: number, py: number, interacting: boolean) => {
      onChange({
        px: clamp(px, X_MIN, X_MAX),
        py: clamp(py, Y_MIN, Y_MAX),
        interacting,
      })
    },
    [onChange],
  )

  const bind = useDrag(({ first, last, movement: [mx, my] }) => {
    if (first) startRef.current = { px: state.px, py: state.py }
    const start = startRef.current
    if (!start) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const sy = VIEW_H / rect.height
    const dxData = (mx * sx) / (PLOT_W / (X_MAX - X_MIN))
    const dyData = -(my * sy) / (PLOT_H / (Y_MAX - Y_MIN))
    update(start.px + dxData, start.py + dyData, !last)
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number, dy: number) => {
        const step = Math.max(Math.abs(dx), Math.abs(dy)) >= 10 ? 0.1 : 0.02
        update(
          state.px + Math.sign(dx) * step,
          state.py + Math.sign(dy) * step,
          false,
        )
      },
      [state.px, state.py, update],
    ),
  )

  const z = preActivation(W, { x: state.px, y: state.py })
  const yhat = predict(W, { x: state.px, y: state.py })

  const ep = boundaryEndpoints(W)
  const x1px = ep ? dataToSvgX(ep.x1) : 0
  const y1px = ep ? dataToSvgY(ep.y1) : 0
  const x2px = ep ? dataToSvgX(ep.x2) : 0
  const y2px = ep ? dataToSvgY(ep.y2) : 0

  const hx = dataToSvgX(state.px)
  const hy = dataToSvgY(state.py)

  // Half-plane tints — orient by the normal (w1, w2). The positive side is
  // where w · x ≥ 0, which the perceptron calls class 1.
  const { nx, ny } = normaliseNormal(W.w1, W.w2)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Input at x equals ${fmt2(state.px)}, y equals ${fmt2(state.py)}. The perceptron's weighted sum is ${fmt2(z)}, so the output is ${yhat}. ${
          yhat === 1
            ? 'The point sits on the positive side of the boundary.'
            : 'The point sits on the negative side of the boundary.'
        }`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Feature space with a draggable input point. Current input ${fmt2(state.px)}, ${fmt2(state.py)}. Perceptron output ${yhat}.`}
      >
        <defs>
          <clipPath id="fwd-clip">
            <rect
              x={PLOT_X0}
              y={PLOT_Y0}
              width={PLOT_X1 - PLOT_X0}
              height={PLOT_Y1 - PLOT_Y0}
            />
          </clipPath>
        </defs>

        <PlotAxes />

        {/* Half-plane tints */}
        <g clipPath="url(#fwd-clip)">
          {ep && (
            <Halfplanes nx={nx} ny={ny} ep={ep} />
          )}
        </g>

        {/* Boundary line */}
        {ep && (
          <line
            x1={x1px}
            y1={y1px}
            x2={x2px}
            y2={y2px}
            stroke="var(--color-vermilion)"
            strokeWidth="2"
          />
        )}

        {/* Boundary label */}
        <text
          x={PLOT_X1 - 10}
          y={PLOT_Y0 + 16}
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          fill="var(--color-vermilion)"
        >
          w · x + b = 0
        </text>

        {/* Draggable input point */}
        <g
          {...bind()}
          ref={handleRef}
          tabIndex={0}
          role="slider"
          aria-label={`Draggable input point. Position x equals ${fmt2(state.px)}, y equals ${fmt2(state.py)}. Perceptron output ${yhat}. Arrow keys to nudge; Shift plus arrow to step larger.`}
          aria-valuemin={X_MIN}
          aria-valuemax={X_MAX}
          aria-valuenow={Number(state.px.toFixed(2))}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={hx} cy={hy} r="22" fill="transparent" />
          <circle
            cx={hx}
            cy={hy}
            r="9"
            fill={
              yhat === 1 ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'
            }
            stroke="var(--color-cream)"
            strokeWidth="2"
          />
        </g>

        {/* Live readout next to the point */}
        <g transform={`translate(${hx + 14}, ${hy - 8})`}>
          <text
            fontFamily="JetBrains Mono, monospace"
            fontSize="11"
            fill="var(--color-ink)"
          >
            x = ({fmt2(state.px)}, {fmt2(state.py)})
          </text>
        </g>

        {/* Hint */}
        <text
          x={PLOT_X1 - 6}
          y={PLOT_Y1 + 40}
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          DRAG &middot; CROSS THE LINE &middot; OUTPUT FLIPS
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2a &mdash; One point, one decision
      </figcaption>
    </figure>
  )
}

/** Normalise (a, b) onto the unit circle, returning the unit vector. */
function normaliseNormal(a: number, b: number) {
  const m = Math.hypot(a, b)
  if (m < 1e-9) return { nx: 1, ny: 0 }
  return { nx: a / m, ny: b / m }
}

/** Light tints on the two half-planes defined by the boundary. */
function Halfplanes({
  nx,
  ny,
  ep,
}: {
  nx: number
  ny: number
  ep: { x1: number; y1: number; x2: number; y2: number }
}) {
  // Build two quadrilaterals: extend the boundary endpoints by ±N along the
  // normal in DATA coordinates, then project to SVG. The polygons are clipped
  // to the plot rect by the parent group's clipPath.
  const BIG = 5
  const posPoly: [number, number][] = [
    [ep.x1, ep.y1],
    [ep.x2, ep.y2],
    [ep.x2 + BIG * nx, ep.y2 + BIG * ny],
    [ep.x1 + BIG * nx, ep.y1 + BIG * ny],
  ]
  const negPoly: [number, number][] = [
    [ep.x1, ep.y1],
    [ep.x2, ep.y2],
    [ep.x2 - BIG * nx, ep.y2 - BIG * ny],
    [ep.x1 - BIG * nx, ep.y1 - BIG * ny],
  ]
  const toSvg = (poly: [number, number][]) =>
    poly.map(([x, y]) => `${dataToSvgX(x)},${dataToSvgY(y)}`).join(' ')
  return (
    <g>
      <polygon
        points={toSvg(posPoly)}
        fill="var(--color-vermilion)"
        fillOpacity="0.06"
      />
      <polygon
        points={toSvg(negPoly)}
        fill="var(--color-graph-ink)"
        fillOpacity="0.05"
      />
    </g>
  )
}

/* ============================================================== */
/* RIGHT PANE — neuron diagram                                     */
/* ============================================================== */

export function RightPane({
  state,
}: {
  state: ForwardState
  onChange: (s: ForwardState) => void
}) {
  const z = preActivation(W, { x: state.px, y: state.py })
  const yhat = predict(W, { x: state.px, y: state.py })

  // Network coordinates
  const IN_X = 130
  const SUM_X = 320
  const STEP_X = 460
  const OUT_X = VIEW_W - 80
  const Y_TOP = 180
  const Y_BOT = 300
  const Y_MID = 240

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Neuron diagram. The input x equals ${fmt2(state.px)} and y equals ${fmt2(state.py)} flow through the weighted edges into the sum z equals ${fmt2(z)}. The step gate emits ${yhat}.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`A neuron diagram showing the forward pass. Inputs ${fmt2(state.px)} and ${fmt2(state.py)} produce weighted sum ${fmt2(z)} and output ${yhat}.`}
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
          FORWARD PASS &middot; THE NEURON
        </text>

        {/* Edges */}
        <line
          x1={IN_X + 20}
          y1={Y_TOP}
          x2={SUM_X - 20}
          y2={Y_MID}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.4"
        />
        <line
          x1={IN_X + 20}
          y1={Y_BOT}
          x2={SUM_X - 20}
          y2={Y_MID}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.4"
        />
        {/* Edge weight labels */}
        <text
          x={(IN_X + SUM_X) / 2}
          y={Y_TOP + 16}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fill="var(--color-vermilion)"
        >
          w₁ = {fmt2(W.w1)}
        </text>
        <text
          x={(IN_X + SUM_X) / 2}
          y={Y_BOT - 4}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fill="var(--color-vermilion)"
        >
          w₂ = {fmt2(W.w2)}
        </text>

        {/* Bias edge */}
        <line
          x1={SUM_X - 60}
          y1={Y_MID - 70}
          x2={SUM_X - 14}
          y2={Y_MID - 14}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
        <circle
          cx={SUM_X - 60}
          cy={Y_MID - 70}
          r="14"
          fill="var(--color-cream)"
          stroke="var(--color-graph-ink)"
          strokeDasharray="2 2"
        />
        <text
          x={SUM_X - 60}
          y={Y_MID - 66}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fill="var(--color-dim)"
        >
          b
        </text>
        <text
          x={SUM_X - 18}
          y={Y_MID - 50}
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          fill="var(--color-vermilion)"
        >
          {fmt2(W.w0)}
        </text>

        {/* Input nodes */}
        <InputNode x={IN_X} y={Y_TOP} label="x" value={fmt2(state.px)} />
        <InputNode x={IN_X} y={Y_BOT} label="y" value={fmt2(state.py)} />

        {/* Summing junction */}
        <circle
          cx={SUM_X}
          cy={Y_MID}
          r="22"
          fill="var(--color-cream)"
          stroke="var(--color-graph-ink)"
          strokeWidth="1.4"
        />
        <text
          x={SUM_X}
          y={Y_MID + 6}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="18"
          fill="var(--color-ink)"
        >
          Σ
        </text>
        <text
          x={SUM_X}
          y={Y_MID + 46}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fill="var(--color-ink)"
        >
          z = {fmt2(z)}
        </text>

        {/* Sum → step edge */}
        <line
          x1={SUM_X + 22}
          y1={Y_MID}
          x2={STEP_X - 22}
          y2={Y_MID}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.4"
        />

        {/* Step gate */}
        <circle
          cx={STEP_X}
          cy={Y_MID}
          r="26"
          fill="var(--color-cream)"
          stroke="var(--color-vermilion)"
          strokeWidth="2"
        />
        {/* Step glyph */}
        <g transform={`translate(${STEP_X - 12}, ${Y_MID - 8})`}>
          <line x1="0" y1="14" x2="11" y2="14" stroke="var(--color-vermilion)" strokeWidth="1.5" />
          <line x1="11" y1="14" x2="11" y2="2" stroke="var(--color-vermilion)" strokeWidth="1.5" />
          <line x1="11" y1="2" x2="24" y2="2" stroke="var(--color-vermilion)" strokeWidth="1.5" />
        </g>

        {/* Output arrow */}
        <line
          x1={STEP_X + 26}
          y1={Y_MID}
          x2={OUT_X - 12}
          y2={Y_MID}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.4"
        />
        <polygon
          points={`${OUT_X - 6},${Y_MID} ${OUT_X - 14},${Y_MID - 5} ${OUT_X - 14},${Y_MID + 5}`}
          fill="var(--color-graph-ink)"
        />
        <text
          x={OUT_X - 26}
          y={Y_MID - 14}
          textAnchor="end"
          fontFamily="JetBrains Mono, monospace"
          fontSize="14"
          fill={yhat === 1 ? 'var(--color-vermilion)' : 'var(--color-ink)'}
        >
          ŷ = {yhat}
        </text>

        {/* Bottom caption */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 58}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          two weights, one bias, one decision
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2b &mdash; The same calculation, shown as wiring
      </figcaption>
    </figure>
  )
}

function InputNode({
  x,
  y,
  label,
  value,
}: {
  x: number
  y: number
  label: string
  value: string
}) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r="20"
        fill="var(--color-cream)"
        stroke="var(--color-graph-ink)"
        strokeWidth="1.4"
      />
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize="12"
        fill="var(--color-ink)"
      >
        {label}
      </text>
      <text
        x={x - 30}
        y={y + 4}
        textAnchor="end"
        fontFamily="JetBrains Mono, monospace"
        fontSize="11"
        fill="var(--color-dim)"
      >
        {value}
      </text>
    </g>
  )
}
