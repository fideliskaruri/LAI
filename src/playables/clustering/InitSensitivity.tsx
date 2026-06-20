import { useMemo, useState } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import {
  POINTS,
  K,
  CLUSTER_COLORS,
  SENSITIVITY_INITS,
  assign,
  updateCentroids,
  type Pt,
} from './scatterData'

/**
 * Initialization sensitivity. The reader cycles through four pre-baked
 * starting positions; each run is converged immediately to its final
 * clustering. Two of the four converge to the three "true" clusters; the
 * other two converge to local minima — clusters split across centroids,
 * or two real clusters merged onto a single centroid.
 *
 * The reader's takeaway: K-means doesn't find the *right* answer; it
 * finds *an* answer. Where you start matters.
 *
 * The accompanying prose names K-means++ as the standard fix and gestures
 * at the choice-of-k problem.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

const TINT_NX = 24
const TINT_NY = 18
const TINT_W = VIEW_W / TINT_NX
const TINT_H = VIEW_H / TINT_NY

const CONVERGED_EPS = 1e-3
const MAX_ITERS = 100

/**
 * Run Lloyd to convergence from the given init. Returns the converged
 * centroids, the assignments, the iteration count, and the final inertia
 * (sum of squared distances from each point to its assigned centroid).
 */
function runToConvergence(initial: Pt[]) {
  let cur = initial.map((c) => ({ ...c }))
  let a = assign(POINTS, cur)
  let iters = 0
  for (let step = 0; step < MAX_ITERS; step++) {
    const { next, drift } = updateCentroids(POINTS, a, cur)
    cur = next
    a = assign(POINTS, cur)
    iters++
    if (drift < CONVERGED_EPS) break
  }
  let inertia = 0
  for (let i = 0; i < POINTS.length; i++) {
    const c = cur[a[i]]
    const dx = POINTS[i].x - c.x
    const dy = POINTS[i].y - c.y
    inertia += dx * dx + dy * dy
  }
  return { centroids: cur, assignments: a, iters, inertia }
}

export function InitSensitivity() {
  const [runIdx, setRunIdx] = useState(0)

  const run = useMemo(() => {
    const init = SENSITIVITY_INITS[runIdx % SENSITIVITY_INITS.length]
    return { init, ...runToConvergence(init) }
  }, [runIdx])

  // Compare against best-known inertia (run 0 is the decent init).
  const bestInertia = useMemo(
    () => runToConvergence(SENSITIVITY_INITS[0]).inertia,
    [],
  )
  const ratio = run.inertia / bestInertia
  const isGood = ratio < 1.1

  const counts = useMemo(() => {
    const c = new Array(K).fill(0)
    for (const a of run.assignments) c[a]++
    return c
  }, [run])

  const tintCells = useMemo(() => {
    const out: Array<{ x: number; y: number; idx: number }> = []
    for (let iy = 0; iy < TINT_NY; iy++) {
      for (let ix = 0; ix < TINT_NX; ix++) {
        const cx = (ix + 0.5) * TINT_W
        const cy = (iy + 0.5) * TINT_H
        const mx = (cx - ORIGIN_X) / UNIT
        const my = (ORIGIN_Y - cy) / UNIT
        let best = 0
        let bestD = Infinity
        for (let k = 0; k < run.centroids.length; k++) {
          const dx = mx - run.centroids[k].x
          const dy = my - run.centroids[k].y
          const d = dx * dx + dy * dy
          if (d < bestD) {
            bestD = d
            best = k
          }
        }
        out.push({ x: ix * TINT_W, y: iy * TINT_H, idx: best })
      }
    }
    return out
  }, [run])

  const narration = isGood
    ? `Run ${runIdx + 1}: converged in ${run.iters} iterations to the three natural clusters. Inertia ${run.inertia.toFixed(2)}, near the best known. Cluster sizes ${counts.join(', ')}.`
    : `Run ${runIdx + 1}: converged in ${run.iters} iterations to a local minimum. Inertia ${run.inertia.toFixed(2)}, ${((ratio - 1) * 100).toFixed(0)} percent worse than the best known. Cluster sizes ${counts.join(', ')}. Different starting positions can land K-means in different clusterings.`

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration} priority="high" />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Initialization sensitivity, run ${runIdx + 1} of ${SENSITIVITY_INITS.length}. ${isGood ? 'Converged to the natural three clusters' : 'Converged to a local minimum — clusters split or merged incorrectly'}. Inertia ${run.inertia.toFixed(2)}.`}
      >
        <g opacity="0.13">
          {tintCells.map((c, i) => (
            <rect
              key={i}
              x={c.x}
              y={c.y}
              width={TINT_W + 0.5}
              height={TINT_H + 0.5}
              fill={CLUSTER_COLORS[c.idx]}
            />
          ))}
        </g>

        <Grid />
        <Axes />

        {/* Initial centroid positions — small faded marks, showing where the
            run started before convergence */}
        {run.init.map((c, i) => {
          const cx = ORIGIN_X + c.x * UNIT
          const cy = ORIGIN_Y - c.y * UNIT
          return (
            <g key={`init-${i}`}>
              <circle
                cx={cx}
                cy={cy}
                r="4"
                fill="none"
                stroke={CLUSTER_COLORS[i]}
                strokeWidth="1"
                strokeOpacity="0.45"
                strokeDasharray="2 2"
              />
            </g>
          )
        })}

        {/* Points coloured by final assignment */}
        {POINTS.map((p, i) => {
          const cx = ORIGIN_X + p.x * UNIT
          const cy = ORIGIN_Y - p.y * UNIT
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="5"
              fill={CLUSTER_COLORS[run.assignments[i]]}
              fillOpacity="0.85"
            />
          )
        })}

        {/* Converged centroids */}
        {run.centroids.map((c, i) => {
          const cx = ORIGIN_X + c.x * UNIT
          const cy = ORIGIN_Y - c.y * UNIT
          return (
            <polygon
              key={i}
              points={`${cx},${cy - 10} ${cx + 10},${cy} ${cx},${cy + 10} ${cx - 10},${cy}`}
              fill="var(--color-cream)"
              stroke={CLUSTER_COLORS[i]}
              strokeWidth="2.5"
            />
          )
        })}

        {/* Readout */}
        <g transform="translate(36, 36)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            INITIALIZATION  ·  RUN {runIdx + 1} / {SENSITIVITY_INITS.length}
          </text>
          <text
            y="22"
            fontFamily="JetBrains Mono, monospace"
            fontSize="13"
            fill="var(--color-ink)"
          >
            converged in {run.iters} iterations
          </text>
          <text
            y="42"
            fontFamily="JetBrains Mono, monospace"
            fontSize="13"
            fill={isGood ? 'var(--color-ink)' : 'var(--color-vermilion)'}
          >
            inertia = {run.inertia.toFixed(2)}
            {!isGood && '  (local minimum)'}
          </text>
        </g>

        {/* Legend: hollow dashed circle == starting position */}
        <g transform={`translate(${VIEW_W - 220}, ${VIEW_H - 36})`}>
          <circle
            cx="6"
            cy="-3"
            r="4"
            fill="none"
            stroke="var(--color-dim)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <text
            x="18"
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.04em"
            fill="var(--color-dim)"
          >
            starting position
          </text>
        </g>
      </svg>

      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setRunIdx((n) => (n + 1) % SENSITIVITY_INITS.length)}
          className="font-sans text-[12px] tracking-[0.18em] uppercase px-4 py-2 border border-vermilion text-vermilion hover:bg-vermilion hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-cream transition-colors"
        >
          Reset &amp; try again
        </button>
      </div>

      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5 &mdash; Where you start matters. Try a few seeds.
      </figcaption>
    </figure>
  )
}

function Grid() {
  return (
    <>
      {Array.from({ length: 13 }, (_, i) => {
        const x = ORIGIN_X + (i - 6) * UNIT
        return (
          <line
            key={`v-${i}`}
            x1={x}
            y1="20"
            x2={x}
            y2={VIEW_H - 20}
            stroke="var(--color-graph-fade)"
            strokeWidth="0.5"
          />
        )
      })}
      {Array.from({ length: 9 }, (_, i) => {
        const y = ORIGIN_Y + (i - 4) * UNIT
        return (
          <line
            key={`h-${i}`}
            x1="20"
            y1={y}
            x2={VIEW_W - 20}
            y2={y}
            stroke="var(--color-graph-fade)"
            strokeWidth="0.5"
          />
        )
      })}
    </>
  )
}

function Axes() {
  return (
    <>
      <line
        x1="20"
        y1={ORIGIN_Y}
        x2={VIEW_W - 20}
        y2={ORIGIN_Y}
        stroke="var(--color-graph-ink)"
        strokeWidth="1"
      />
      <line
        x1={ORIGIN_X}
        y1="20"
        x2={ORIGIN_X}
        y2={VIEW_H - 20}
        stroke="var(--color-graph-ink)"
        strokeWidth="1"
      />
    </>
  )
}
