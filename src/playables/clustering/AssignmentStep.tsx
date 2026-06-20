import { useEffect, useMemo, useState } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import {
  POINTS,
  K,
  CLUSTER_COLORS,
  RANDOM_INIT_CENTROIDS,
  assign,
} from './scatterData'

/**
 * The assignment step. Same scene as RandomInit: three fixed centroids,
 * thirty points. The reader presses "step" — vermilion lines flash from each
 * point to its assigned centroid for ~1200 ms, then fade. After the flash,
 * the points are coloured by assignment and stay that way.
 *
 * This isolates the *first half* of one Lloyd iteration: every point joins
 * its nearest king. Centroids do not move in this act; that's the next one.
 *
 * Accessibility: the step button is focusable and keyboard-activated; the
 * CanvasNarrative announces the transition at high priority.
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

const FLASH_MS = 1200

export function AssignmentStep() {
  const centroids = useMemo(
    () => RANDOM_INIT_CENTROIDS.map((c) => ({ ...c })),
    [],
  )
  const assignments = useMemo(() => assign(POINTS, centroids), [centroids])

  const [assigned, setAssigned] = useState(false)
  const [flashOn, setFlashOn] = useState(false)

  const counts = useMemo(() => {
    const c = new Array(K).fill(0)
    for (const a of assignments) c[a]++
    return c
  }, [assignments])

  useEffect(() => {
    if (!flashOn) return
    const t = window.setTimeout(() => setFlashOn(false), FLASH_MS)
    return () => window.clearTimeout(t)
  }, [flashOn])

  const handleStep = () => {
    setAssigned(true)
    setFlashOn(true)
  }

  const handleReset = () => {
    setAssigned(false)
    setFlashOn(false)
  }

  const narration = assigned
    ? `Assignment step complete. Cluster sizes: ${counts.join(', ')}. Each point now belongs to its nearest centroid.`
    : 'Centroids placed. Points still unassigned. Press step to draw the assignment lines.'

  // Voronoi tint cells — only shown after the step
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
  }, [centroids])

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narration}
        priority={assigned ? 'high' : 'normal'}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={
          assigned
            ? `Assignment step: each point has been coloured by its nearest centroid. Cluster sizes: ${counts.join(', ')}.`
            : 'Three centroids placed. Thirty points await assignment. Press the step button to assign each point to its nearest centroid.'
        }
      >
        {/* Voronoi tint only after assignment */}
        {assigned && (
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

        {/* Assignment lines — flash on the step then fade.
            Drawn under the points and centroids. */}
        {assigned && (
          <g
            style={{
              opacity: flashOn ? 0.85 : 0,
              transition: 'opacity 700ms ease-out',
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
          const fill = assigned
            ? CLUSTER_COLORS[assignments[i]]
            : 'var(--color-graph-ink)'
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

        {/* Centroid marks (no drag) */}
        {centroids.map((c, i) => {
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
            STEP 1  ·  ASSIGN
          </text>
          <text
            y="22"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="14"
            fill="var(--color-ink)"
          >
            Each point joins its nearest king.
          </text>
        </g>
      </svg>

      {/* Controls live outside the SVG so the button has native focus rings
          and the keyboard hit-target is obvious. */}
      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleStep}
          disabled={assigned}
          className="font-sans text-[12px] tracking-[0.18em] uppercase px-4 py-2 border border-vermilion text-vermilion disabled:opacity-40 hover:bg-vermilion hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-cream transition-colors"
        >
          Step &rarr; Assign
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
        Fig. 3 &mdash; The assignment step: every point picks its nearest centroid.
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
