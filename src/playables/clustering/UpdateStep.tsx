import { useEffect, useMemo, useRef, useState } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import {
  POINTS,
  K,
  CLUSTER_COLORS,
  RANDOM_INIT_CENTROIDS,
  assign,
  updateCentroids,
  type Pt,
} from './scatterData'

/**
 * The update step. Same scene; same starting centroids as the assignment
 * act. The step button toggles between "assign" and "update": one click
 * runs the assignment step (points recolour, assignment lines flash); the
 * next click moves each centroid to the mean of its assigned points. Drift
 * (sum of per-centroid distances moved on the last update) is shown in the
 * top-right alongside the iteration counter. Convergence: drift below 1e-3.
 *
 * Accessibility: step button is focusable; reduced-motion users see the
 * jump immediately. CanvasNarrative announces drift each iteration.
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
const FLASH_MS = 900

type Phase = 'idle' | 'assigned' | 'updated'

export function UpdateStep() {
  const [centroids, setCentroids] = useState<Pt[]>(() =>
    RANDOM_INIT_CENTROIDS.map((c) => ({ ...c })),
  )
  const [phase, setPhase] = useState<Phase>('idle')
  const [iteration, setIteration] = useState(0)
  const [drift, setDrift] = useState<number | null>(null)
  const [flashOn, setFlashOn] = useState(false)
  const flashTimerRef = useRef<number | null>(null)

  const assignments = useMemo(() => assign(POINTS, centroids), [centroids])

  const counts = useMemo(() => {
    const c = new Array(K).fill(0)
    for (const a of assignments) c[a]++
    return c
  }, [assignments])

  useEffect(() => {
    return () => {
      if (flashTimerRef.current !== null) {
        window.clearTimeout(flashTimerRef.current)
      }
    }
  }, [])

  const converged = drift !== null && drift < CONVERGED_EPS

  const handleStep = () => {
    if (phase === 'idle' || phase === 'updated') {
      // Run assignment step
      setPhase('assigned')
      setFlashOn(true)
      if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current)
      flashTimerRef.current = window.setTimeout(() => setFlashOn(false), FLASH_MS)
    } else {
      // phase === 'assigned' — run update step
      const { next, drift: d } = updateCentroids(POINTS, assignments, centroids)
      setCentroids(next)
      setDrift(d)
      setIteration((n) => n + 1)
      setPhase('updated')
    }
  }

  const handleReset = () => {
    setCentroids(RANDOM_INIT_CENTROIDS.map((c) => ({ ...c })))
    setPhase('idle')
    setIteration(0)
    setDrift(null)
    setFlashOn(false)
  }

  const handleRunToConvergence = () => {
    // Synchronously run until drift < eps or 100 iters as a safety cap.
    let cur = centroids.map((c) => ({ ...c }))
    let it = iteration
    let d = drift ?? Infinity
    for (let step = 0; step < 100; step++) {
      const a = assign(POINTS, cur)
      const { next, drift: dd } = updateCentroids(POINTS, a, cur)
      cur = next
      d = dd
      it++
      if (d < CONVERGED_EPS) break
    }
    setCentroids(cur)
    setIteration(it)
    setDrift(d)
    setPhase('updated')
  }

  const stepLabel =
    phase === 'idle' || phase === 'updated' ? 'Step → Assign' : 'Step → Update'

  const narration =
    phase === 'idle'
      ? 'Starting state. No iterations yet. Press step to begin the Lloyd loop.'
      : phase === 'assigned'
        ? `Iteration ${iteration + 1}, assignment phase. Cluster sizes: ${counts.join(', ')}. Press step again to move each centroid to its cluster mean.`
        : `Iteration ${iteration}, update complete. Drift ${drift?.toFixed(3) ?? '–'}. ${converged ? 'Below the convergence threshold.' : 'Press step to continue.'}`

  // Voronoi tint — visible once we've assigned at least once
  const tintCells = useMemo(() => {
    if (phase === 'idle') return []
    const out: Array<{ x: number; y: number; idx: number }> = []
    for (let iy = 0; iy < TINT_NY; iy++) {
      for (let ix = 0; ix < TINT_NX; ix++) {
        const cx = (ix + 0.5) * TINT_W
        const cy = (iy + 0.5) * TINT_H
        const mx = (cx - ORIGIN_X) / UNIT
        const my = (ORIGIN_Y - cy) / UNIT
        let best = 0
        let bestD = Infinity
        for (let k = 0; k < centroids.length; k++) {
          const dx = mx - centroids[k].x
          const dy = my - centroids[k].y
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
  }, [centroids, phase])

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narration}
        priority={phase === 'updated' ? 'high' : 'normal'}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Lloyd's algorithm. Iteration ${iteration}. Centroids ${centroids.map((c) => `(${c.x.toFixed(2)}, ${c.y.toFixed(2)})`).join('; ')}. Drift ${drift === null ? 'not yet measured' : drift.toFixed(3)}.${converged ? ' Converged.' : ''}`}
      >
        {phase !== 'idle' && (
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
        )}

        <Grid />
        <Axes />

        {/* Assignment lines flash */}
        {phase !== 'idle' && (
          <g
            style={{
              opacity: flashOn ? 0.85 : 0,
              transition: 'opacity 600ms ease-out',
            }}
          >
            {POINTS.map((p, i) => {
              const px = ORIGIN_X + p.x * UNIT
              const py = ORIGIN_Y - p.y * UNIT
              const c = centroids[assignments[i]]
              const cx = ORIGIN_X + c.x * UNIT
              const cy = ORIGIN_Y - c.y * UNIT
              return (
                <line
                  key={i}
                  x1={px}
                  y1={py}
                  x2={cx}
                  y2={cy}
                  stroke="var(--color-vermilion)"
                  strokeWidth="1"
                  strokeOpacity="0.55"
                />
              )
            })}
          </g>
        )}

        {/* Points */}
        {POINTS.map((p, i) => {
          const cx = ORIGIN_X + p.x * UNIT
          const cy = ORIGIN_Y - p.y * UNIT
          const fill =
            phase === 'idle'
              ? 'var(--color-graph-ink)'
              : CLUSTER_COLORS[assignments[i]]
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="5"
              fill={fill}
              fillOpacity="0.85"
            />
          )
        })}

        {/* Centroid marks */}
        {centroids.map((c, i) => {
          const cx = ORIGIN_X + c.x * UNIT
          const cy = ORIGIN_Y - c.y * UNIT
          return (
            <g
              key={i}
              style={{ transition: 'transform 350ms ease-out' }}
            >
              <polygon
                points={`${cx},${cy - 10} ${cx + 10},${cy} ${cx},${cy + 10} ${cx - 10},${cy}`}
                fill="var(--color-cream)"
                stroke={CLUSTER_COLORS[i]}
                strokeWidth="2.5"
              />
            </g>
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
            LLOYD'S ALGORITHM  ·  k = 3
          </text>
          <text
            y="22"
            fontFamily="JetBrains Mono, monospace"
            fontSize="14"
            fill="var(--color-ink)"
          >
            iteration {iteration}
          </text>
          <text
            y="42"
            fontFamily="JetBrains Mono, monospace"
            fontSize="13"
            fill={converged ? 'var(--color-vermilion)' : 'var(--color-ink)'}
          >
            drift &epsilon; = {drift === null ? '–' : drift.toFixed(3)}
            {converged ? '  (converged)' : ''}
          </text>
        </g>
      </svg>

      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleStep}
          disabled={converged}
          className="font-sans text-[12px] tracking-[0.18em] uppercase px-4 py-2 border border-vermilion text-vermilion disabled:opacity-40 hover:bg-vermilion hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-cream transition-colors"
        >
          {stepLabel}
        </button>
        <button
          type="button"
          onClick={handleRunToConvergence}
          disabled={converged}
          className="font-sans text-[12px] tracking-[0.18em] uppercase px-4 py-2 border border-dim text-dim disabled:opacity-40 hover:text-ink hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-cream transition-colors"
        >
          Run to convergence
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="font-sans text-[12px] tracking-[0.18em] uppercase px-4 py-2 border border-dim text-dim hover:text-ink hover:border-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-cream transition-colors"
        >
          Reset
        </button>
      </div>

      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4 &mdash; The update step: each king walks to the mean of its kingdom.
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
