import { useCallback, useMemo, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import {
  POINTS,
  K,
  CLUSTER_COLORS,
  RANDOM_INIT_CENTROIDS,
  assign,
  type Pt,
} from './scatterData'

/**
 * Act: start anywhere. Three centroids are dropped on the plane at fixed
 * starting positions. The reader drags any one of them; each point recolours
 * to match its nearest centroid; the Voronoi regions shade in the background.
 *
 * No iteration here. Just: nearest centroid wins, and you can see where the
 * boundaries fall by dragging the seeds around.
 *
 * Accessibility: each centroid handle is tab-focusable. Arrow keys nudge by
 * 0.1 math-units, Shift+arrow by 1. A CanvasNarrative reads the current
 * count per cluster.
 *
 * Note on hooks: K is fixed at 3 (see scatterData.ts), so the three drag
 * bindings and three keyboard-nudge hooks are unrolled at the top level
 * rather than created inside a map. This keeps the hook-call order stable
 * across renders.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

// Voronoi tint: sample a coarse grid and colour each cell by the nearest
// centroid. 24×18 cells keeps the SVG light.
const TINT_NX = 24
const TINT_NY = 18
const TINT_W = VIEW_W / TINT_NX
const TINT_H = VIEW_H / TINT_NY

const fmt = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(2)

function nudgeAmount(d: number): number {
  if (d === 0) return 0
  return Math.abs(d) >= 10 ? Math.sign(d) * 1 : Math.sign(d) * 0.1
}

export function RandomInit() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const ref0 = useRef<SVGGElement | null>(null)
  const ref1 = useRef<SVGGElement | null>(null)
  const ref2 = useRef<SVGGElement | null>(null)
  const handleRefs = [ref0, ref1, ref2]

  const [centroids, setCentroids] = useState<Pt[]>(
    () => RANDOM_INIT_CENTROIDS.map((c) => ({ ...c })),
  )
  const start0 = useRef<Pt | null>(null)
  const start1 = useRef<Pt | null>(null)
  const start2 = useRef<Pt | null>(null)

  const dragFor = useCallback(
    (i: number, startRef: React.MutableRefObject<Pt | null>) => {
      return ({ first, movement: [mx, my] }: { first: boolean; movement: [number, number] }) => {
        if (first) startRef.current = { ...centroids[i] }
        const start = startRef.current
        if (!start) return
        const rect = svgRef.current?.getBoundingClientRect()
        if (!rect) return
        const sx = VIEW_W / rect.width
        const sy = VIEW_H / rect.height
        setCentroids((cur) => {
          const next = cur.slice()
          next[i] = {
            x: start.x + (mx * sx) / UNIT,
            y: start.y - (my * sy) / UNIT,
          }
          return next
        })
      }
    },
    [centroids],
  )

  const bind0 = useDrag(dragFor(0, start0))
  const bind1 = useDrag(dragFor(1, start1))
  const bind2 = useDrag(dragFor(2, start2))
  const binds = [bind0, bind1, bind2]

  const nudge0 = useCallback((dx: number, dy: number) => {
    setCentroids((cur) => {
      const next = cur.slice()
      next[0] = { x: next[0].x + nudgeAmount(dx), y: next[0].y + nudgeAmount(dy) }
      return next
    })
  }, [])
  const nudge1 = useCallback((dx: number, dy: number) => {
    setCentroids((cur) => {
      const next = cur.slice()
      next[1] = { x: next[1].x + nudgeAmount(dx), y: next[1].y + nudgeAmount(dy) }
      return next
    })
  }, [])
  const nudge2 = useCallback((dx: number, dy: number) => {
    setCentroids((cur) => {
      const next = cur.slice()
      next[2] = { x: next[2].x + nudgeAmount(dx), y: next[2].y + nudgeAmount(dy) }
      return next
    })
  }, [])
  useKeyNudge(ref0, nudge0)
  useKeyNudge(ref1, nudge1)
  useKeyNudge(ref2, nudge2)

  const assignments = useMemo(
    () => assign(POINTS, centroids),
    [centroids],
  )

  const counts = useMemo(() => {
    const c = new Array(K).fill(0)
    for (const a of assignments) c[a]++
    return c
  }, [assignments])

  // Voronoi tint cells.
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

  const narration = `Three centroids on the plane. Cluster sizes by nearest-centroid: ${counts.join(', ')}. Drag any centroid; the colours follow.`

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration} priority="normal" />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Random initialization. Three centroids dropped on the plane. Each of thirty points is coloured by its nearest centroid. Current cluster sizes: ${counts.join(', ')}.`}
      >
        {/* Voronoi tint */}
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

        {/* Points coloured by assignment */}
        {POINTS.map((p, i) => {
          const cx = ORIGIN_X + p.x * UNIT
          const cy = ORIGIN_Y - p.y * UNIT
          const idx = assignments[i]
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="5"
              fill={CLUSTER_COLORS[idx]}
              fillOpacity="0.85"
            />
          )
        })}

        {/* Centroid handles */}
        {centroids.map((c, i) => {
          const cx = ORIGIN_X + c.x * UNIT
          const cy = ORIGIN_Y - c.y * UNIT
          return (
            <g
              key={i}
              {...binds[i]()}
              ref={handleRefs[i]}
              tabIndex={0}
              role="button"
              aria-label={`Centroid ${i + 1}. Currently ${fmt(c.x).trim()}, ${fmt(c.y).trim()}. Arrow keys to nudge, Shift plus arrow to step by one.`}
              style={{ cursor: 'grab', touchAction: 'none' }}
              className="focus-visible:outline-none [&:focus-visible_polygon:last-of-type]:stroke-vermilion-deep"
            >
              <circle cx={cx} cy={cy} r="22" fill="transparent" />
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
            RANDOM INITIALIZATION  ·  k = 3
          </text>
          <text
            y="22"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="14"
            fill="var(--color-ink)"
          >
            Drag any centroid &mdash; points follow.
          </text>
        </g>

        {/* Cluster size chips */}
        <g transform={`translate(36, ${VIEW_H - 60})`}>
          {counts.map((n, i) => (
            <g key={i} transform={`translate(${i * 110}, 0)`}>
              <rect
                width="8"
                height="8"
                y="-7"
                fill={CLUSTER_COLORS[i]}
                fillOpacity="0.85"
              />
              <text
                x="16"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill="var(--color-ink)"
              >
                cluster {i + 1}: {n}
              </text>
            </g>
          ))}
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2 &mdash; Three random centroids. Each point joins its nearest king.
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
