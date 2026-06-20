import { useCallback, useMemo, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import {
  POINTS,
  COMPONENT_COLORS,
  responsibilities,
  covEllipse,
  type MixtureComponent,
  type Pt,
} from './gmmData'

/**
 * Act 3 — soft assignment, made tangible. Each point becomes a tiny pie chart
 * sliced by its three responsibilities. Drag any Gaussian's center handle;
 * every pie redraws.
 *
 * Keyboard: each handle is focusable with arrow-key nudging. Drag uses
 * use-gesture as everywhere else in the chapter.
 *
 * Covariances are fixed in this act so the reader's mental model stays simple:
 * move the centers, watch the soft assignments redistribute. The next act
 * generalises to the full E-step where covariances and weights also matter.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

const PIE_R = 8

// Fixed covariances and weights — only means are draggable
const FIXED_COV = { a: 0.45, b: 0.0, c: 0.45 }
const FIXED_PI = 1 / 3

const INITIAL_MEANS: Pt[] = [
  { x: -2.4, y: -1.1 },
  { x: 0.2, y: 1.8 },
  { x: 2.6, y: -1.0 },
]

export function Responsibilities() {
  const [means, setMeans] = useState<Pt[]>(INITIAL_MEANS)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRefs = useRef<(SVGGElement | null)[]>([null, null, null])
  // Stable RefObject proxies for hooks that expect a RefObject.
  const handleRefProxies = useMemo(
    () =>
      [0, 1, 2].map((k) => ({
        get current() {
          return handleRefs.current[k]
        },
      })),
    [],
  )
  const dragStartRef = useRef<Pt | null>(null)
  const [dragging, setDragging] = useState<number | null>(null)

  const mixture: MixtureComponent[] = useMemo(
    () =>
      means.map((m) => ({
        mean: m,
        cov: { ...FIXED_COV },
        pi: FIXED_PI,
      })),
    [means],
  )

  const gammas = useMemo(
    () => responsibilities(POINTS, mixture),
    [mixture],
  )

  // Drag handler factory — closure captures `k`. Hooks themselves are called
  // at the top level (one useDrag per handle).
  const makeDragHandler = (k: number) =>
    ({ first, last, movement: [mx, my] }: { first: boolean; last: boolean; movement: [number, number] }) => {
      if (first) {
        dragStartRef.current = { ...means[k] }
        setDragging(k)
      }
      const start = dragStartRef.current
      if (!start || !svgRef.current) return
      const rect = svgRef.current.getBoundingClientRect()
      const sx = VIEW_W / rect.width
      const sy = VIEW_H / rect.height
      const dxMath = (mx * sx) / UNIT
      const dyMath = -(my * sy) / UNIT
      const next: Pt = {
        x: Math.max(-5.5, Math.min(5.5, start.x + dxMath)),
        y: Math.max(-4.2, Math.min(4.2, start.y + dyMath)),
      }
      setMeans((cur) => cur.map((m, i) => (i === k ? next : m)))
      if (last) {
        dragStartRef.current = null
        setDragging(null)
      }
    }
  const bind0 = useDrag(makeDragHandler(0))
  const bind1 = useDrag(makeDragHandler(1))
  const bind2 = useDrag(makeDragHandler(2))
  const binds = [bind0, bind1, bind2]

  // Keyboard nudges — one useCallback / useKeyNudge per handle, all at top level.
  const nudge0 = useCallback((dx: number, dy: number) => {
    setMeans((cur) =>
      cur.map((m, i) =>
        i === 0
          ? {
              x: Math.max(-5.5, Math.min(5.5, m.x + dx * 0.1)),
              y: Math.max(-4.2, Math.min(4.2, m.y + dy * 0.1)),
            }
          : m,
      ),
    )
  }, [])
  const nudge1 = useCallback((dx: number, dy: number) => {
    setMeans((cur) =>
      cur.map((m, i) =>
        i === 1
          ? {
              x: Math.max(-5.5, Math.min(5.5, m.x + dx * 0.1)),
              y: Math.max(-4.2, Math.min(4.2, m.y + dy * 0.1)),
            }
          : m,
      ),
    )
  }, [])
  const nudge2 = useCallback((dx: number, dy: number) => {
    setMeans((cur) =>
      cur.map((m, i) =>
        i === 2
          ? {
              x: Math.max(-5.5, Math.min(5.5, m.x + dx * 0.1)),
              y: Math.max(-4.2, Math.min(4.2, m.y + dy * 0.1)),
            }
          : m,
      ),
    )
  }, [])
  useKeyNudge(handleRefProxies[0], nudge0)
  useKeyNudge(handleRefProxies[1], nudge1)
  useKeyNudge(handleRefProxies[2], nudge2)

  // Iso-contours for each component (single Mahalanobis-1 ellipse)
  const contours = useMemo(
    () =>
      mixture.map((c) =>
        covEllipse(c, 1.6).map((p) => ({
          x: ORIGIN_X + p.x * UNIT,
          y: ORIGIN_Y - p.y * UNIT,
        })),
      ),
    [mixture],
  )

  // Per-point pie slice path (math: starting at -π/2 going clockwise, slice for each component)
  const pieSlices = useMemo(() => {
    return POINTS.map((p, i) => {
      const cx = ORIGIN_X + p.x * UNIT
      const cy = ORIGIN_Y - p.y * UNIT
      const slices: Array<{ d: string; fill: string }> = []
      let angle = -Math.PI / 2
      for (let k = 0; k < mixture.length; k++) {
        const g = gammas[i][k]
        const a0 = angle
        const a1 = angle + g * 2 * Math.PI
        // SVG arc
        const x0 = cx + PIE_R * Math.cos(a0)
        const y0 = cy + PIE_R * Math.sin(a0)
        const x1 = cx + PIE_R * Math.cos(a1)
        const y1 = cy + PIE_R * Math.sin(a1)
        const largeArc = g > 0.5 ? 1 : 0
        const d =
          g > 0.999
            ? // Full circle — single path
              `M ${cx} ${cy} m ${-PIE_R} 0 a ${PIE_R} ${PIE_R} 0 1 0 ${2 * PIE_R} 0 a ${PIE_R} ${PIE_R} 0 1 0 ${-2 * PIE_R} 0 Z`
            : `M ${cx} ${cy} L ${x0} ${y0} A ${PIE_R} ${PIE_R} 0 ${largeArc} 1 ${x1} ${y1} Z`
        slices.push({ d, fill: COMPONENT_COLORS[k] })
        angle = a1
      }
      return slices
    })
  }, [gammas, mixture])

  // Narration — describe the most uncertain point as it shifts
  const mostUncertainIdx = useMemo(() => {
    let bestEntropy = -1
    let idx = 0
    for (let i = 0; i < gammas.length; i++) {
      let H = 0
      for (const g of gammas[i]) {
        if (g > 1e-6) H -= g * Math.log(g)
      }
      if (H > bestEntropy) {
        bestEntropy = H
        idx = i
      }
    }
    return idx
  }, [gammas])

  const pct = gammas[mostUncertainIdx].map((g) => Math.round(g * 100))
  const narration = dragging !== null
    ? `Dragging component ${dragging + 1}. Most ambiguous point: ${pct[0]} percent vermilion, ${pct[1]} percent blue, ${pct[2]} percent olive.`
    : `Three Gaussian centers. Each point is a pie chart of its responsibilities across the three components. Drag a center to see the pies redistribute.`

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narration}
        priority="normal"
        isInteracting={dragging !== null}
        debounceMs={300}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Three Gaussian components. Each of thirty data points displays its membership probabilities as a pie chart. Drag a component's center to see all pies redistribute."
      >
        <Grid />
        <Axes />

        {/* Iso-contours */}
        {contours.map((pts, i) => (
          <polyline
            key={`iso-${i}`}
            points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={COMPONENT_COLORS[i]}
            strokeWidth="1.5"
            strokeOpacity="0.55"
            strokeDasharray="4 3"
          />
        ))}

        {/* Pie charts (one per point) */}
        {pieSlices.map((slices, i) => (
          <g key={`pie-${i}`}>
            {slices.map((s, k) => (
              <path
                key={k}
                d={s.d}
                fill={s.fill}
                fillOpacity="0.92"
                stroke="var(--color-cream)"
                strokeWidth="0.6"
              />
            ))}
          </g>
        ))}

        {/* Draggable centers */}
        {means.map((m, k) => {
          const cx = ORIGIN_X + m.x * UNIT
          const cy = ORIGIN_Y - m.y * UNIT
          return (
            <g
              key={k}
              ref={(el) => {
                handleRefs.current[k] = el
              }}
              {...binds[k]()}
              tabIndex={0}
              role="slider"
              aria-label={`Component ${k + 1} center. At (${m.x.toFixed(2)}, ${m.y.toFixed(2)}). Arrow keys to nudge, Shift+arrow for larger steps.`}
              aria-valuemin={-5.5}
              aria-valuemax={5.5}
              aria-valuenow={Number(m.x.toFixed(2))}
              style={{ cursor: 'grab', touchAction: 'none', outline: 'none' }}
              className="focus-visible:outline-none [&:focus-visible_polygon:last-of-type]:stroke-vermilion-deep"
            >
              <circle cx={cx} cy={cy} r="22" fill="transparent" />
              <polygon
                points={`${cx},${cy - 11} ${cx + 11},${cy} ${cx},${cy + 11} ${cx - 11},${cy}`}
                fill="var(--color-cream)"
                stroke={COMPONENT_COLORS[k]}
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
            RESPONSIBILITIES  ·  DRAG A CENTER
          </text>
          <text
            y="22"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="13"
            fill="var(--color-ink)"
          >
            &gamma;<tspan baselineShift="sub" fontSize="9">ik</tspan> = P(component k | point i)
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2 &mdash; Each point is a pie. Drag a center; every pie redistributes.
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
