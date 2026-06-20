import { useCallback, useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import { PlotAxes, ClassScatter } from './Axes'
import {
  POINTS,
  VIEW_W,
  VIEW_H,
  PLOT_X0,
  PLOT_X1,
  PLOT_Y0,
  PLOT_Y1,
  X_MAX,
  Y_MAX,
  X_MIN,
  Y_MIN,
  dataToSvgX,
  dataToSvgY,
  predict,
  logLoss,
  mseLoss,
  boundaryEndpoints,
  boundaryNormal,
  type BoundaryState,
} from './dataset'

/**
 * Act 4 — why squared error isn't right.
 *
 *  Left  : same draggable boundary as act 3, but now the points that the
 *          current boundary mis-classifies (predicted p > 0.5 for a blue,
 *          or p < 0.5 for a red) are ringed.
 *  Right : two large readouts — log-loss and squared error. A toggle lets
 *          the reader pick which is being "minimised". The currently
 *          selected loss is shown in vermilion; the other in dim ink.
 *          Below: a small per-point chart of penalties — for a few of the
 *          worst misclassifications it shows the gap between log-loss
 *          (which blows up for confident wrong predictions) and MSE
 *          (which doesn't).
 *
 * Shared LossState extends BoundaryState with a 'mode' flag.
 */

export interface LossState extends BoundaryState {
  mode: 'log' | 'mse'
}

export const INITIAL_LOSS: LossState = {
  angle: -0.55,
  offset: 0,
  gain: 0.4,
  mode: 'log',
  interacting: false,
}

const fmt2 = (n: number) => n.toFixed(2)
const fmt3 = (n: number) => n.toFixed(3)

/* ============================================================== */
/* LEFT PANE — boundary + highlighted misclassifications           */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: LossState
  onChange: (s: LossState) => void
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const rotateRef = useRef<SVGGElement | null>(null)
  const translateRef = useRef<SVGGElement | null>(null)
  const startStateRef = useRef<LossState | null>(null)

  const update = useCallback(
    (next: Partial<LossState>, interacting: boolean) => {
      onChange({ ...state, ...next, interacting })
    },
    [state, onChange],
  )

  const bindTranslate = useDrag(({ first, last, movement: [mx, my] }) => {
    if (first) startStateRef.current = state
    const start = startStateRef.current
    if (!start) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const sy = VIEW_H / rect.height
    const dxData = (mx * sx) / ((PLOT_X1 - PLOT_X0) / (X_MAX - X_MIN))
    const dyData = -(my * sy) / ((PLOT_Y1 - PLOT_Y0) / (Y_MAX - Y_MIN))
    const { nx, ny } = boundaryNormal(start)
    const dOff = nx * dxData + ny * dyData
    update({ offset: start.offset + dOff }, !last)
  })

  const bindRotate = useDrag(({ first, last, movement: [mx, my] }) => {
    if (first) startStateRef.current = state
    const start = startStateRef.current
    if (!start) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const sy = VIEW_H / rect.height
    const ep = boundaryEndpoints(start)
    const x2px = dataToSvgX(ep.x2)
    const y2px = dataToSvgY(ep.y2)
    const ax = dataToSvgX((ep.x1 + ep.x2) / 2)
    const ay = dataToSvgY((ep.y1 + ep.y2) / 2)
    const newX = x2px + mx * sx
    const newY = y2px + my * sy
    const dx = newX - ax
    const dy = -(newY - ay)
    const angle = Math.atan2(dy, dx)
    update({ angle }, !last)
  })

  useKeyNudge(
    translateRef,
    useCallback(
      (dx: number, dy: number) => {
        const step = Math.max(Math.abs(dx), Math.abs(dy)) >= 10 ? 1 : 0.2
        const dir = dy !== 0 ? Math.sign(dy) : Math.sign(dx)
        update({ offset: state.offset + dir * step }, false)
      },
      [state.offset, update],
    ),
  )
  useKeyNudge(
    rotateRef,
    useCallback(
      (dx: number, dy: number) => {
        const step = Math.max(Math.abs(dx), Math.abs(dy)) >= 10 ? 0.15 : 0.03
        const dir = dx !== 0 ? Math.sign(dx) : Math.sign(dy)
        update({ angle: state.angle + dir * step }, false)
      },
      [state.angle, update],
    ),
  )

  const ep = boundaryEndpoints(state)
  const x1px = dataToSvgX(ep.x1)
  const y1px = dataToSvgY(ep.y1)
  const x2px = dataToSvgX(ep.x2)
  const y2px = dataToSvgY(ep.y2)
  const midX = (x1px + x2px) / 2
  const midY = (y1px + y2px) / 2

  // Which points are mis-classified?
  const misclassified = new Set<number>()
  POINTS.forEach((p, i) => {
    const phat = predict(state, p)
    if ((p.y_label === 1 && phat < 0.5) || (p.y_label === 0 && phat > 0.5)) {
      misclassified.add(i)
    }
  })

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Decision boundary. ${misclassified.size} of ${POINTS.length} points currently misclassified — they are ringed.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Feature space with the decision boundary. ${misclassified.size} points are misclassified and ringed.`}
      >
        <PlotAxes xLabel="Feature 1" yLabel="Feature 2" />
        <ClassScatter pts={POINTS} highlight={misclassified} />

        <line
          x1={x1px}
          y1={y1px}
          x2={x2px}
          y2={y2px}
          stroke="var(--color-vermilion)"
          strokeWidth="2.2"
        />

        <g
          {...bindTranslate()}
          ref={translateRef}
          tabIndex={0}
          role="button"
          aria-label={`Translate boundary. Current offset ${fmt2(state.offset)}.`}
          style={{ cursor: 'move', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={midX} cy={midY} r="22" fill="transparent" />
          <circle
            cx={midX}
            cy={midY}
            r="8"
            fill="var(--color-cream)"
            stroke="var(--color-vermilion)"
            strokeWidth="2"
          />
        </g>
        <g
          {...bindRotate()}
          ref={rotateRef}
          tabIndex={0}
          role="button"
          aria-label={`Rotate boundary. Current angle ${fmt2(state.angle)}.`}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={x2px} cy={y2px} r="22" fill="transparent" />
          <circle
            cx={x2px}
            cy={y2px}
            r="7"
            fill="var(--color-vermilion)"
            stroke="var(--color-cream)"
            strokeWidth="2"
          />
        </g>

        {/* Readout */}
        <g transform={`translate(${PLOT_X0 + 12}, ${PLOT_Y0 + 18})`}>
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
            MISCLASSIFIED
          </text>
          <text y="20" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-vermilion)">
            {misclassified.size} / {POINTS.length}
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
          RING &middot; WRONG SIDE OF THE LINE
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3a &mdash; The boundary and the points it gets wrong
      </figcaption>
    </figure>
  )
}

/* ============================================================== */
/* RIGHT PANE — the two loss readouts                              */
/* ============================================================== */

export function RightPane({
  state,
  onChange,
}: {
  state: LossState
  onChange: (s: LossState) => void
}) {
  const L_log = logLoss(state)
  const L_mse = mseLoss(state)

  // Per-point penalty distribution — show as a small bar chart, indexed by
  // the point's predicted probability against its true label.
  const perPoint = POINTS.map((p, i) => {
    const phat = predict(state, p)
    const EPS = 1e-7
    const safePhat = Math.max(EPS, Math.min(1 - EPS, phat))
    const ll = -(p.y_label * Math.log(safePhat) + (1 - p.y_label) * Math.log(1 - safePhat))
    const sq = (p.y_label - phat) ** 2
    return { i, p, phat, ll, sq }
  })

  // Sort by log-loss descending; take the worst eight.
  const worst = [...perPoint].sort((a, b) => b.ll - a.ll).slice(0, 8)

  // Render bar chart
  const CHART_X0 = PLOT_X0 + 16
  const CHART_X1 = PLOT_X1 - 16
  const CHART_Y0 = PLOT_Y0 + 168
  const CHART_Y1 = PLOT_Y1 - 56
  const BAR_W = (CHART_X1 - CHART_X0 - 14) / (worst.length * 2 + 1)
  const maxBar = Math.max(...worst.flatMap((w) => [w.ll, w.sq]), 0.5)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Log loss is ${fmt3(L_log)}. Squared error is ${fmt3(L_mse)}. Currently minimising ${state.mode === 'log' ? 'log loss' : 'squared error'}.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Loss readouts. Log loss ${fmt3(L_log)}, squared error ${fmt3(L_mse)}.`}
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
          y="68"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          TWO PENALTIES, SIDE BY SIDE
        </text>

        {/* Big log-loss card */}
        <g transform={`translate(${VIEW_W / 2 - 200}, 96)`}>
          <LossCard
            label="LOG LOSS"
            value={L_log}
            active={state.mode === 'log'}
            onClick={() => onChange({ ...state, mode: 'log' })}
            formula="−Σ y log p + (1−y) log(1−p)"
          />
        </g>
        <g transform={`translate(${VIEW_W / 2 + 20}, 96)`}>
          <LossCard
            label="SQUARED ERROR"
            value={L_mse}
            active={state.mode === 'mse'}
            onClick={() => onChange({ ...state, mode: 'mse' })}
            formula="Σ (y − p)²"
          />
        </g>

        {/* Per-point penalty chart */}
        <text
          x={CHART_X0}
          y={CHART_Y0 - 12}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          WORST 8 POINTS &middot; PENALTY PER POINT
        </text>

        {/* Baseline */}
        <line
          x1={CHART_X0}
          y1={CHART_Y1}
          x2={CHART_X1}
          y2={CHART_Y1}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
        />

        {worst.map((w, idx) => {
          const groupX = CHART_X0 + 14 + idx * (BAR_W * 2 + 4)
          const llH = (w.ll / maxBar) * (CHART_Y1 - CHART_Y0)
          const sqH = (w.sq / maxBar) * (CHART_Y1 - CHART_Y0)
          return (
            <g key={w.i}>
              <rect
                x={groupX}
                y={CHART_Y1 - llH}
                width={BAR_W}
                height={llH}
                fill="var(--color-vermilion)"
                fillOpacity={state.mode === 'log' ? 0.85 : 0.35}
              />
              <rect
                x={groupX + BAR_W + 2}
                y={CHART_Y1 - sqH}
                width={BAR_W}
                height={sqH}
                fill="var(--color-graph-ink)"
                fillOpacity={state.mode === 'mse' ? 0.85 : 0.35}
              />
            </g>
          )
        })}

        {/* Legend */}
        <g transform={`translate(${CHART_X0}, ${CHART_Y1 + 18})`}>
          <rect
            width="10"
            height="10"
            fill="var(--color-vermilion)"
            fillOpacity={state.mode === 'log' ? 0.85 : 0.35}
          />
          <text
            x="16"
            y="9"
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.16em"
            fill="var(--color-dim)"
          >
            LOG LOSS
          </text>
          <rect
            x="100"
            width="10"
            height="10"
            fill="var(--color-graph-ink)"
            fillOpacity={state.mode === 'mse' ? 0.85 : 0.35}
          />
          <text
            x="116"
            y="9"
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.16em"
            fill="var(--color-dim)"
          >
            SQUARED
          </text>
          <text
            x="220"
            y="9"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="11"
            fill="var(--color-dim)"
          >
            log loss blows up on confident wrongs; squared error doesn&rsquo;t
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3b &mdash; Two ways to count what&rsquo;s wrong
      </figcaption>
    </figure>
  )
}

function LossCard({
  label,
  value,
  active,
  onClick,
  formula,
}: {
  label: string
  value: number
  active: boolean
  onClick: () => void
  formula: string
}) {
  return (
    <g
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      tabIndex={0}
      role="button"
      aria-pressed={active}
      aria-label={`Toggle ${label}. Currently ${active ? 'active' : 'inactive'}. Value ${fmt3(value)}.`}
      style={{ cursor: 'pointer' }}
      className="focus-visible:outline-none [&:focus-visible_rect:first-of-type]:stroke-vermilion-deep"
    >
      <rect
        width="180"
        height="62"
        fill={active ? 'var(--color-vermilion)' : 'transparent'}
        fillOpacity={active ? 0.08 : 0}
        stroke={active ? 'var(--color-vermilion)' : 'var(--color-graph-fade)'}
        strokeWidth="1"
      />
      <text
        x="14"
        y="18"
        fontFamily="Inter, sans-serif"
        fontSize="10"
        letterSpacing="0.18em"
        fill={active ? 'var(--color-vermilion)' : 'var(--color-dim)'}
      >
        {label}
      </text>
      <text
        x="14"
        y="42"
        fontFamily="JetBrains Mono, monospace"
        fontSize="18"
        fill={active ? 'var(--color-vermilion)' : 'var(--color-ink)'}
      >
        {fmt3(value)}
      </text>
      <text
        x="14"
        y="56"
        fontFamily="JetBrains Mono, monospace"
        fontSize="9"
        fill={active ? 'var(--color-vermilion)' : 'var(--color-dim)'}
      >
        {formula}
      </text>
    </g>
  )
}
