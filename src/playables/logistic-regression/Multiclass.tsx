import { useCallback, useRef } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import { PlotAxes, MultiScatter } from './Axes'
import {
  MULTI_POINTS,
  MULTI_WEIGHTS,
  CLASS_COLORS,
  VIEW_W,
  VIEW_H,
  PLOT_X0,
  PLOT_X1,
  PLOT_Y0,
  PLOT_Y1,
  X_MIN,
  X_MAX,
  Y_MIN,
  Y_MAX,
  dataToSvgX,
  dataToSvgY,
  softmaxScores,
  type ClassLabel,
} from './dataset'

/**
 * Act 7 — more than two classes.
 *
 *  Left  : a 3-class scatter (blue, red, amber), with the boundary of the
 *          currently focused class drawn as a one-vs-rest separator. A small
 *          tap-target near each cloud lets you switch focus.
 *  Right : a triptych — three smaller sigmoid panels, one per class, showing
 *          σ(z_k) along that class's own "perpendicular." The currently
 *          focused class is highlighted. Below, a softmax bar chart with
 *          the three probabilities for the probe point (defaults to the
 *          plot centre).
 *
 * State shared: { focus, probe }. Focus is the class currently "asked".
 * Probe is the index of a specific point to inspect, or null for the centre.
 */

export interface MulticlassState {
  focus: ClassLabel
  probe: number | null
}

export const INITIAL_MULTICLASS: MulticlassState = { focus: 0, probe: null }

const fmt2 = (n: number) => n.toFixed(2)
const fmt3 = (n: number) => n.toFixed(3)

const CENTER_PT = { x: (X_MIN + X_MAX) / 2, y: (Y_MIN + Y_MAX) / 2 }
const CLASS_LABELS: Record<ClassLabel, string> = {
  0: 'Class 0 · blue',
  1: 'Class 1 · red',
  2: 'Class 2 · amber',
}

/* ============================================================== */
/* LEFT PANE — 3-class scatter + one-vs-rest line for focus class */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: MulticlassState
  onChange: (s: MulticlassState) => void
}) {
  // The "one-vs-rest" line for the focused class: where z_focus = 0 against
  // the linear scorer for that class only. (The actual decision-boundary in
  // softmax involves the max over k; this is an approximation for teaching
  // — the prose flags it.)
  const w = MULTI_WEIGHTS[state.focus]

  // Compute endpoints by intersecting the line wx·x + wy·y + b = 0 with the
  // plot rectangle.
  const ep = clipLineToRect(w.wx, w.wy, w.b)

  // Probe point — null means centre of the plot
  const probePt = state.probe !== null ? MULTI_POINTS[state.probe] : CENTER_PT
  const probeProb = softmaxScores(probePt)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Three-class scatter. Currently focused: ${CLASS_LABELS[state.focus]}. The line on the plot is that class's one-versus-rest separator. Click any point to inspect its softmax probabilities.`}
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Three-class scatter with the one-versus-rest boundary for ${CLASS_LABELS[state.focus]} highlighted.`}
      >
        <PlotAxes xLabel="Feature 1" yLabel="Feature 2" />

        <MultiScatter pts={MULTI_POINTS} focus={state.focus} probeIndex={state.probe} />

        {/* One-vs-rest boundary for the focused class */}
        {ep && (
          <line
            x1={dataToSvgX(ep.x1)}
            y1={dataToSvgY(ep.y1)}
            x2={dataToSvgX(ep.x2)}
            y2={dataToSvgY(ep.y2)}
            stroke={CLASS_COLORS[state.focus]}
            strokeWidth="2.2"
            strokeOpacity="0.9"
          />
        )}

        {/* Class focus pills — top-right of the plot */}
        <g transform={`translate(${PLOT_X1 - 158}, ${PLOT_Y0 + 8})`}>
          {([0, 1, 2] as ClassLabel[]).map((k, i) => (
            <FocusPill
              key={k}
              x={i * 50}
              klass={k}
              active={state.focus === k}
              onClick={() => onChange({ ...state, focus: k })}
            />
          ))}
        </g>

        {/* Click overlay — each point is a small clickable target */}
        {MULTI_POINTS.map((p, i) => (
          <circle
            key={i}
            cx={dataToSvgX(p.x)}
            cy={dataToSvgY(p.y)}
            r="14"
            fill="transparent"
            tabIndex={0}
            role="button"
            aria-label={`Inspect point ${i + 1} of class ${CLASS_LABELS[p.y_label]}. Position ${p.x}, ${p.y}.`}
            style={{ cursor: 'pointer' }}
            onClick={() => onChange({ ...state, probe: i })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onChange({ ...state, probe: i })
              }
            }}
          />
        ))}

        {/* Probe readout */}
        {state.probe !== null && (
          <g transform={`translate(${PLOT_X0 + 12}, ${PLOT_Y0 + 18})`}>
            <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
              PROBE &middot; SOFTMAX
            </text>
            <text y="20" fontFamily="JetBrains Mono, monospace" fontSize="11" fill={CLASS_COLORS[0]}>
              p(0) = {fmt3(probeProb[0])}
            </text>
            <text y="34" fontFamily="JetBrains Mono, monospace" fontSize="11" fill={CLASS_COLORS[1]}>
              p(1) = {fmt3(probeProb[1])}
            </text>
            <text y="48" fontFamily="JetBrains Mono, monospace" fontSize="11" fill={CLASS_COLORS[2]}>
              p(2) = {fmt3(probeProb[2])}
            </text>
          </g>
        )}

        <text
          x={PLOT_X1 - 6}
          y={PLOT_Y1 + 40}
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          CLICK PILL &middot; CHANGE FOCUS &middot; CLICK POINT &middot; PROBE
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5a &mdash; Three clouds, three scorers
      </figcaption>
    </figure>
  )
}

function FocusPill({
  x,
  klass,
  active,
  onClick,
}: {
  x: number
  klass: ClassLabel
  active: boolean
  onClick: () => void
}) {
  const color = CLASS_COLORS[klass]
  const pillRef = useRef<SVGGElement | null>(null)
  useKeyNudge(
    pillRef,
    useCallback(() => onClick(), [onClick]),
  )
  return (
    <g
      ref={pillRef}
      transform={`translate(${x}, 0)`}
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
      aria-label={`Focus on ${CLASS_LABELS[klass]}.`}
      style={{ cursor: 'pointer' }}
      className="focus-visible:outline-none [&:focus-visible_rect]:stroke-vermilion-deep"
    >
      <rect
        width="42"
        height="22"
        fill={active ? color : 'transparent'}
        fillOpacity={active ? 0.18 : 0}
        stroke={color}
        strokeWidth={active ? 1.6 : 1}
      />
      <text
        x="21"
        y="15"
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize="11"
        fill={color}
      >
        k = {klass}
      </text>
    </g>
  )
}

/** Intersect a·x + b·y + c = 0 with a rectangle, returning two intersection points. */
function clipLineToRect(
  a: number,
  b: number,
  c: number,
): { x1: number; y1: number; x2: number; y2: number } | null {
  const pts: { x: number; y: number }[] = []
  // x = X_MIN
  if (Math.abs(b) > 1e-8) {
    const y = -(a * X_MIN + c) / b
    if (y >= Y_MIN && y <= Y_MAX) pts.push({ x: X_MIN, y })
  }
  // x = X_MAX
  if (Math.abs(b) > 1e-8) {
    const y = -(a * X_MAX + c) / b
    if (y >= Y_MIN && y <= Y_MAX) pts.push({ x: X_MAX, y })
  }
  // y = Y_MIN
  if (Math.abs(a) > 1e-8) {
    const x = -(b * Y_MIN + c) / a
    if (x >= X_MIN && x <= X_MAX) pts.push({ x, y: Y_MIN })
  }
  // y = Y_MAX
  if (Math.abs(a) > 1e-8) {
    const x = -(b * Y_MAX + c) / a
    if (x >= X_MIN && x <= X_MAX) pts.push({ x, y: Y_MAX })
  }
  if (pts.length < 2) return null
  return { x1: pts[0].x, y1: pts[0].y, x2: pts[1].x, y2: pts[1].y }
}

/* ============================================================== */
/* RIGHT PANE — three sigmoid panels + softmax bar chart           */
/* ============================================================== */

export function RightPane({
  state,
  onChange,
}: {
  state: MulticlassState
  onChange: (s: MulticlassState) => void
}) {
  // Probe point
  const probePt = state.probe !== null ? MULTI_POINTS[state.probe] : CENTER_PT
  const probeProb = softmaxScores(probePt)

  // For each class, build a tiny sigmoid panel. The "perpendicular" is the
  // direction of (w.wx, w.wy). The reader sees three little curves with a
  // ball where the current probe falls on each.
  const panelW = 152
  const panelH = 88
  const panelTopY = 96
  const panelStartX = (VIEW_W - panelW * 3 - 36) / 2

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Three one-versus-rest sigmoid panels. Focus on ${CLASS_LABELS[state.focus]}. ${
          state.probe !== null
            ? `Probe softmax probabilities — class 0 ${fmt2(probeProb[0])}, class 1 ${fmt2(probeProb[1])}, class 2 ${fmt2(probeProb[2])}.`
            : 'Click a point in the left pane to inspect its softmax probabilities.'
        }`}
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Triptych of three sigmoid panels (one per class) plus a softmax bar chart for the probe.`}
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
          THREE SIGMOIDS, ONE SOFTMAX
        </text>

        {/* Three panels */}
        {([0, 1, 2] as ClassLabel[]).map((k, i) => (
          <SigmoidPanel
            key={k}
            x={panelStartX + i * (panelW + 18)}
            y={panelTopY}
            w={panelW}
            h={panelH}
            klass={k}
            probe={probePt}
            active={state.focus === k}
            onClick={() => onChange({ ...state, focus: k })}
          />
        ))}

        {/* Softmax bar chart */}
        <g transform={`translate(${PLOT_X0 + 30}, ${panelTopY + panelH + 36})`}>
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            SOFTMAX &middot; PROBE = {state.probe === null ? 'centre' : `point ${state.probe + 1}`}
          </text>
          {probeProb.map((p, k) => {
            const barW = p * (PLOT_X1 - PLOT_X0 - 60)
            return (
              <g key={k} transform={`translate(0, ${28 + k * 32})`}>
                <text
                  x="-6"
                  y="14"
                  textAnchor="end"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="11"
                  fill={CLASS_COLORS[k as ClassLabel]}
                >
                  k={k}
                </text>
                <rect
                  x="0"
                  y="2"
                  width={barW}
                  height="20"
                  fill={CLASS_COLORS[k as ClassLabel]}
                  fillOpacity="0.75"
                />
                <text
                  x={barW + 8}
                  y="17"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="11"
                  fill="var(--color-ink)"
                >
                  {fmt3(p)}
                </text>
              </g>
            )
          })}
        </g>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 52}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          three scores → exponentiate, normalise → three probabilities
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5b &mdash; The softmax — three sigmoids that have to agree
      </figcaption>
    </figure>
  )
}

function SigmoidPanel({
  x,
  y,
  w,
  h,
  klass,
  probe,
  active,
  onClick,
}: {
  x: number
  y: number
  w: number
  h: number
  klass: ClassLabel
  probe: { x: number; y: number }
  active: boolean
  onClick: () => void
}) {
  const wk = MULTI_WEIGHTS[klass]
  const color = CLASS_COLORS[klass]
  // Plot σ(z_k) along d ∈ [−15, 15]
  const D_MIN = -15
  const D_MAX = 15
  const N = 80
  const path: string[] = []
  for (let i = 0; i <= N; i++) {
    const d = D_MIN + ((D_MAX - D_MIN) * i) / N
    const z = d * 0.5 // tune so the curve fills the panel nicely
    const s = 1 / (1 + Math.exp(-z))
    const px = x + 8 + (i / N) * (w - 16)
    const py = y + h - 12 - s * (h - 24)
    path.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(2)} ${py.toFixed(2)}`)
  }
  // Probe z for this class
  const zProbe = wk.wx * probe.x + wk.wy * probe.y + wk.b
  // Map z to a normalised d for plotting (same scale as the path)
  const dProbe = Math.max(D_MIN, Math.min(D_MAX, zProbe))
  const sigProbe = 1 / (1 + Math.exp(-(dProbe * 0.5)))
  const px = x + 8 + ((dProbe - D_MIN) / (D_MAX - D_MIN)) * (w - 16)
  const py = y + h - 12 - sigProbe * (h - 24)

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
      aria-label={`Sigmoid panel for class ${klass}. ${active ? 'Focused.' : 'Click to focus.'} σ at probe: ${sigProbe.toFixed(3)}.`}
      style={{ cursor: 'pointer' }}
      className="focus-visible:outline-none [&:focus-visible_rect:first-of-type]:stroke-vermilion-deep"
    >
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={active ? color : 'transparent'}
        fillOpacity={active ? 0.08 : 0}
        stroke={color}
        strokeWidth={active ? 1.4 : 0.8}
      />
      <text
        x={x + 8}
        y={y + 16}
        fontFamily="Inter, sans-serif"
        fontSize="9"
        letterSpacing="0.16em"
        fill={color}
      >
        k = {klass}
      </text>
      {/* The σ curve */}
      <path d={path.join(' ')} fill="none" stroke={color} strokeWidth="1.4" />
      {/* The probe marker */}
      <line
        x1={px}
        y1={y + h - 12}
        x2={px}
        y2={py}
        stroke={color}
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <circle cx={px} cy={py} r="4" fill={color} stroke="var(--color-cream)" strokeWidth="1.4" />
    </g>
  )
}
