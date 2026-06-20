import { useCallback, useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import { PlotAxes, ClassScatter, ClassLegend } from './Axes'
import {
  OVERLAP_POINTS,
  VIEW_W,
  VIEW_H,
  PLOT_X0,
  PLOT_X1,
  PLOT_Y0,
  PLOT_Y1,
  X_MIN,
  X_MAX,
  dataToSvgX,
  dataToSvgY,
  lineSlopeIntercept,
  signedDistance,
  marginWidth,
  type Line2D,
} from './dataset'

/**
 * Act 5 — non-separable data, soft margin, C slider.
 *
 *  Left  : the overlapping scatter, with a soft-margin separator drawn for
 *          the current C. Points inside the margin or on the wrong side are
 *          marked as "violations".
 *  Right : the C slider plus a card showing (a) the resulting margin width,
 *          (b) the number of violations, and (c) a sentence describing the
 *          trade-off the slider controls.
 *
 * Co-mutating: the slider on the right writes the shared state object that
 * the left pane reads. Initial C = 1.0.
 */

export interface SoftMarginState {
  /** Soft-margin tradeoff: small C → wide margin, many violations.
   *  Large C → narrow margin, few violations. */
  C: number
  interacting: boolean
}

export const INITIAL_SOFT_MARGIN: SoftMarginState = {
  C: 1.0,
  interacting: false,
}

const C_MIN = 0.05
const C_MAX = 20.0
const C_LOG_MIN = Math.log(C_MIN)
const C_LOG_MAX = Math.log(C_MAX)

const fmt2 = (n: number) => n.toFixed(2)

/**
 * Toy "soft-margin" solver. For each C we choose the separator + margin that
 * maximises a proxy of the SVM objective:
 *
 *   score(line, margin) = margin − C · Σ violations
 *
 * where a violation is a point on the wrong side of the boundary plus a
 * fraction of points inside the margin. Searching jointly over (yLeft, yRight,
 * margin) is wasteful, so we precompute the candidate set once below.
 *
 * This is not the real QP solution; it's a hand-fit picker that gives a
 * monotonic, pedagogically clear response to C: small C → wider margin.
 */
function pickSoftMargin(C: number): { line: Line2D; margin: number; violations: number } {
  let best: { line: Line2D; margin: number; violations: number; score: number } | null = null
  for (let yL = 8; yL <= 32; yL += 1.0) {
    for (let yR = 8; yR <= 32; yR += 1.0) {
      const line: Line2D = { yLeft: yL, yRight: yR }
      const { slope } = lineSlopeIntercept(line)
      const norm = Math.sqrt(1 + slope * slope)
      // Try a few candidate widths for this line orientation.
      for (let halfW = 1.5; halfW <= 11; halfW += 0.5) {
        const margin = halfW
        let viol = 0
        for (const p of OVERLAP_POINTS) {
          const s = signedDistance(p, line)
          // Convention: +1 should give positive signed distance after sign-flip
          // chosen by majority. Compute below.
          // We just compute hinge-like loss: 1 − y·signed/normMargin.
          const signedNorm = s / margin
          // Choose convention so that majority +1 points are positive.
          const yPred = p.label === 1 ? signedNorm : -signedNorm
          if (yPred < 1) viol += 1 - yPred
        }
        const score = margin - C * viol * 0.1
        // count integer-style violations for display
        const vCount = countMisclassifiedSoft(line, margin)
        void norm
        if (best === null || score > best.score) {
          best = { line, margin, violations: vCount, score }
        }
      }
    }
  }
  return best!
}

/** Count points that are strictly misclassified OR inside the margin band. */
function countMisclassifiedSoft(line: Line2D, margin: number): number {
  // Pick sign convention so majority of +1 are on the positive side.
  let posPlus = 0
  let negPlus = 0
  for (const p of OVERLAP_POINTS) {
    const s = signedDistance(p, line)
    if (p.label === 1) {
      if (s > 0) posPlus++
      else negPlus++
    }
  }
  const plusSign: 1 | -1 = posPlus >= negPlus ? 1 : -1
  let count = 0
  for (const p of OVERLAP_POINTS) {
    const s = signedDistance(p, line) * plusSign
    // Margin in perpendicular distance: convert to signedDistance threshold.
    const { slope } = lineSlopeIntercept(line)
    const norm = Math.sqrt(1 + slope * slope)
    const perp = s / norm
    if (p.label === 1) {
      if (perp < margin) count++
    } else {
      if (perp > -margin) count++
    }
  }
  return count
}

/** Memoize across renders — pickSoftMargin is O(few thousand) but synchronous,
 *  and we call it on every drag tick. */
const cache = new Map<number, { line: Line2D; margin: number; violations: number }>()
function pickSoftMarginCached(C: number) {
  const key = Math.round(C * 100) / 100
  const hit = cache.get(key)
  if (hit) return hit
  const v = pickSoftMargin(key)
  cache.set(key, v)
  return v
}

/* ============================================================ */
/* LEFT pane — overlap scatter + soft-margin line                */
/* ============================================================ */

export function LeftPane({ state }: { state: SoftMarginState; onChange?: (s: SoftMarginState) => void }) {
  const { line, margin } = pickSoftMarginCached(state.C)
  const violations = countMisclassifiedSoft(line, margin)
  const { slope } = lineSlopeIntercept(line)
  const dy = margin * Math.sqrt(1 + slope * slope)

  const yLpx = clampPx(dataToSvgY(line.yLeft))
  const yRpx = clampPx(dataToSvgY(line.yRight))
  const yLpxA = clampPx(dataToSvgY(line.yLeft + dy))
  const yRpxA = clampPx(dataToSvgY(line.yRight + dy))
  const yLpxB = clampPx(dataToSvgY(line.yLeft - dy))
  const yRpxB = clampPx(dataToSvgY(line.yRight - dy))

  // Identify violating points to mark them.
  // Sign convention: majority of +1 on positive side
  let posPlus = 0
  let negPlus = 0
  for (const p of OVERLAP_POINTS) {
    const s = signedDistance(p, line)
    if (p.label === 1) {
      if (s > 0) posPlus++
      else negPlus++
    }
  }
  const plusSign: 1 | -1 = posPlus >= negPlus ? 1 : -1
  const violatingIdx = new Set<number>()
  for (let i = 0; i < OVERLAP_POINTS.length; i++) {
    const p = OVERLAP_POINTS[i]
    const s = signedDistance(p, line) * plusSign
    const perp = s / Math.sqrt(1 + slope * slope)
    if (p.label === 1 && perp < margin) violatingIdx.add(i)
    if (p.label === -1 && perp > -margin) violatingIdx.add(i)
  }

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Overlapping two-class scatter. With C equals ${fmt2(state.C)}, the soft-margin solver chose margin width ${fmt2(margin)} and accepts ${violations} margin violations.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Overlapping scatter with a soft-margin separator. Margin ${fmt2(margin)}, violations ${violations}.`}
      >
        <PlotAxes />

        <ClassScatter pts={OVERLAP_POINTS} fade={0.4} highlight={violatingIdx} />

        {/* Margin band */}
        <polygon
          points={`${dataToSvgX(X_MIN)},${yLpxA} ${dataToSvgX(X_MAX)},${yRpxA} ${dataToSvgX(X_MAX)},${yRpxB} ${dataToSvgX(X_MIN)},${yLpxB}`}
          fill="var(--color-vermilion)"
          fillOpacity="0.08"
        />
        <line
          x1={dataToSvgX(X_MIN)}
          y1={yLpxA}
          x2={dataToSvgX(X_MAX)}
          y2={yRpxA}
          stroke="var(--color-vermilion)"
          strokeWidth="1"
          strokeOpacity="0.55"
          strokeDasharray="4 4"
        />
        <line
          x1={dataToSvgX(X_MIN)}
          y1={yLpxB}
          x2={dataToSvgX(X_MAX)}
          y2={yRpxB}
          stroke="var(--color-vermilion)"
          strokeWidth="1"
          strokeOpacity="0.55"
          strokeDasharray="4 4"
        />

        {/* The hyperplane */}
        <line
          x1={dataToSvgX(X_MIN)}
          y1={yLpx}
          x2={dataToSvgX(X_MAX)}
          y2={yRpx}
          stroke="var(--color-vermilion)"
          strokeWidth="2.4"
        />

        {/* Violators — ringed in a duller red */}
        {Array.from(violatingIdx).map((i) => {
          const p = OVERLAP_POINTS[i]
          const cx = dataToSvgX(p.x)
          const cy = dataToSvgY(p.y)
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r="10" fill="none" stroke="#b94a3c" strokeWidth="1.5" strokeDasharray="2 2" />
              {p.label === 1 ? (
                <circle cx={cx} cy={cy} r="5" fill="var(--color-vermilion)" />
              ) : (
                <g>
                  <line x1={cx - 5} y1={cy - 5} x2={cx + 5} y2={cy + 5} stroke="var(--color-ink)" strokeWidth="1.8" />
                  <line x1={cx - 5} y1={cy + 5} x2={cx + 5} y2={cy - 5} stroke="var(--color-ink)" strokeWidth="1.8" />
                </g>
              )}
            </g>
          )
        })}

        <ClassLegend x={PLOT_X0 + 8} y={PLOT_Y0 + 8} />

        <text
          x={PLOT_X1 - 6}
          y={PLOT_Y1 + 40}
          textAnchor="end"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          DASHED RINGS &middot; MARGIN VIOLATIONS
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4a &mdash; The two classes spill into each other
      </figcaption>
    </figure>
  )
}

function clampPx(y: number) {
  return Math.max(PLOT_Y0 - 12, Math.min(PLOT_Y1 + 12, y))
}

/* ============================================================ */
/* RIGHT pane — C slider                                         */
/* ============================================================ */

const SLIDER_Y = 360
const SLIDER_X_MIN = 90
const SLIDER_X_MAX = VIEW_W - 90

const cToX = (c: number) =>
  SLIDER_X_MIN + ((Math.log(c) - C_LOG_MIN) / (C_LOG_MAX - C_LOG_MIN)) * (SLIDER_X_MAX - SLIDER_X_MIN)
const xToC = (x: number) =>
  Math.exp(C_LOG_MIN + ((x - SLIDER_X_MIN) / (SLIDER_X_MAX - SLIDER_X_MIN)) * (C_LOG_MAX - C_LOG_MIN))

export function RightPane({
  state,
  onChange,
}: {
  state: SoftMarginState
  onChange: (s: SoftMarginState) => void
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const startRef = useRef<number | null>(null)

  const setC = useCallback(
    (c: number, down: boolean) => {
      const clamped = Math.max(C_MIN, Math.min(C_MAX, c))
      onChange({ C: clamped, interacting: down })
    },
    [onChange],
  )

  const bind = useDrag(({ down, first, movement: [mx] }) => {
    if (first) startRef.current = state.C
    const startC = startRef.current
    if (startC === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const startX = cToX(startC)
    const newX = Math.max(SLIDER_X_MIN, Math.min(SLIDER_X_MAX, startX + mx * sx))
    setC(xToC(newX), down)
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const isShift = Math.abs(dx) >= 10
        const factor = isShift ? 1.5 : 1.12
        if (dx > 0) setC(state.C * factor, false)
        else setC(state.C / factor, false)
      },
      [state, setC],
    ),
  )

  const handleX = cToX(state.C)
  const { line, margin } = pickSoftMarginCached(state.C)
  const violations = countMisclassifiedSoft(line, margin)

  const interpretation =
    state.C < 0.5
      ? 'small C — wider margin, many violations'
      : state.C < 5
        ? 'moderate C — a middle ground'
        : 'large C — narrow margin, few violations'

  // Ticks at decade marks
  const ticks = [0.1, 0.3, 1, 3, 10]

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`C equals ${fmt2(state.C)}. Margin width ${fmt2(margin)}. ${violations} violations. ${interpretation}.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Soft-margin control. C equals ${fmt2(state.C)}. Margin ${fmt2(margin)}. ${violations} violations.`}
      >
        <text
          x={VIEW_W / 2}
          y="56"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THE SOFT-MARGIN DIAL
        </text>
        <text
          x={VIEW_W / 2}
          y="80"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-ink)"
        >
          how much should one mistake cost?
        </text>

        {/* Big readouts */}
        <g transform={`translate(${VIEW_W / 2 - 110}, 140)`}>
          <text
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="36"
            fill="var(--color-vermilion)"
          >
            {fmt2(margin)}
          </text>
          <text
            y="22"
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            MARGIN
          </text>
        </g>
        <g transform={`translate(${VIEW_W / 2 + 110}, 140)`}>
          <text
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="36"
            fill="var(--color-ink)"
          >
            {violations}
          </text>
          <text
            y="22"
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            VIOLATIONS
          </text>
        </g>

        {/* Trade-off sentence */}
        <text
          x={VIEW_W / 2}
          y={220}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-dim)"
        >
          {interpretation}
        </text>

        {/* Slider */}
        <text
          x={SLIDER_X_MIN}
          y={SLIDER_Y - 22}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          C (PENALTY ON VIOLATIONS)
        </text>
        <line
          x1={SLIDER_X_MIN}
          y1={SLIDER_Y}
          x2={SLIDER_X_MAX}
          y2={SLIDER_Y}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.2"
        />
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={cToX(t)}
              y1={SLIDER_Y - 6}
              x2={cToX(t)}
              y2={SLIDER_Y + 6}
              stroke="var(--color-graph-ink)"
              strokeWidth="1"
            />
            <text
              x={cToX(t)}
              y={SLIDER_Y + 22}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
            >
              {t}
            </text>
          </g>
        ))}
        <g
          {...bind()}
          ref={handleRef}
          tabIndex={0}
          role="slider"
          aria-label={`Soft-margin penalty C. Current value ${fmt2(state.C)}. Arrows nudge, shift plus arrow steps further. Smaller C means wider margin and more violations.`}
          aria-valuemin={C_MIN}
          aria-valuemax={C_MAX}
          aria-valuenow={Number(state.C.toFixed(2))}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={handleX} cy={SLIDER_Y} r="22" fill="transparent" />
          <circle
            cx={handleX}
            cy={SLIDER_Y}
            r="8"
            fill="var(--color-vermilion)"
            stroke="var(--color-cream)"
            strokeWidth="2"
          />
        </g>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 40}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          maximise margin minus C times total slack
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4b &mdash; The dial Cortes added in 1995
      </figcaption>
    </figure>
  )
}

// Unused — kept exported for parallel structure with other acts (and to silence
// the linter if a consumer wants the raw margin number).
export { marginWidth }
