import { useCallback, useMemo, useRef, useState } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Non-convex landscape: f(x, y) = x⁴ − 2x² + y². Two minima at (±1, 0)
 * and a saddle at (0, 0). The user clicks anywhere on the heatmap to
 * pick a starting point; the trajectory runs out for 40 steps with a
 * small learning rate, and the result lands somewhere — usually one
 * of the two minima, occasionally hung up at the saddle for points
 * starting near the y-axis.
 *
 * The reader plays it like a small instrument: click around, see where
 * the descent ends up. The lesson is that gradient descent finds *a*
 * minimum, not *the* minimum.
 */

const VIEW_W = 600
const VIEW_H = 480

const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT_X = 110
const UNIT_Y = 130

const X_MIN = -1.9
const X_MAX = 1.9
const Y_MIN = -1.4
const Y_MAX = 1.4

const f = (x: number, y: number) => x * x * x * x - 2 * x * x + y * y
const gradF = (x: number, y: number) => ({ gx: 4 * x * x * x - 4 * x, gy: 2 * y })

// f min = −1 at (±1, 0), f max at corners = (1.9)⁴ − 2(1.9)² + (1.4)² ≈ 13 − 7.2 + 1.96 ≈ 7.8
const F_MIN = -1
const F_MAX = 7.8
const F_SPAN = F_MAX - F_MIN

const STEPS = 60
const ETA = 0.05

const CELL_PX = 14
const COLS = Math.ceil((X_MAX - X_MIN) * UNIT_X / CELL_PX)
const ROWS = Math.ceil((Y_MAX - Y_MIN) * UNIT_Y / CELL_PX)

const PANEL_X_MIN = ORIGIN_X + X_MIN * UNIT_X
const PANEL_X_MAX = ORIGIN_X + X_MAX * UNIT_X
const PANEL_Y_MIN = ORIGIN_Y - Y_MAX * UNIT_Y
const PANEL_Y_MAX = ORIGIN_Y - Y_MIN * UNIT_Y

function heatColor(value: number): string {
  const t = Math.min(1, Math.max(0, (value - F_MIN) / F_SPAN))
  const r1 = 243, g1 = 239, b1 = 230
  const r2 = 110, g2 = 28, b2 = 20
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r},${g},${b})`
}

function runDescent(start: { x: number; y: number }, steps: number) {
  const path: Array<{ x: number; y: number }> = [start]
  let x = start.x
  let y = start.y
  for (let i = 0; i < steps; i++) {
    const { gx, gy } = gradF(x, y)
    x = x - ETA * gx
    y = y - ETA * gy
    path.push({ x, y })
    if (!isFinite(x) || !isFinite(y)) break
  }
  return path
}

// Classify the endpoint of a trajectory.
function classify(end: { x: number; y: number }): 'left-min' | 'right-min' | 'saddle' | 'other' {
  const dxL = Math.hypot(end.x + 1, end.y)
  const dxR = Math.hypot(end.x - 1, end.y)
  const dS = Math.hypot(end.x, end.y)
  if (dxL < 0.08) return 'left-min'
  if (dxR < 0.08) return 'right-min'
  if (dS < 0.08) return 'saddle'
  return 'other'
}

interface Run {
  start: { x: number; y: number }
  path: Array<{ x: number; y: number }>
  outcome: 'left-min' | 'right-min' | 'saddle' | 'other'
}

const PRESET_STARTS: Array<{ x: number; y: number }> = [
  { x: -1.6, y: 1.0 },
  { x: 1.5, y: 0.9 },
  { x: 0.04, y: 1.2 },
]

export function NonConvex() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [runs, setRuns] = useState<Run[]>(() =>
    PRESET_STARTS.map((s) => {
      const path = runDescent(s, STEPS)
      return { start: s, path, outcome: classify(path[path.length - 1]) }
    }),
  )

  const cells = useMemo(() => {
    const result: Array<{ x: number; y: number; fill: string }> = []
    for (let i = 0; i < COLS; i++) {
      for (let j = 0; j < ROWS; j++) {
        const xMath = X_MIN + (i + 0.5) * ((X_MAX - X_MIN) / COLS)
        const yMath = Y_MAX - (j + 0.5) * ((Y_MAX - Y_MIN) / ROWS)
        const value = f(xMath, yMath)
        result.push({
          x: PANEL_X_MIN + i * ((PANEL_X_MAX - PANEL_X_MIN) / COLS),
          y: PANEL_Y_MIN + j * ((PANEL_Y_MAX - PANEL_Y_MIN) / ROWS),
          fill: heatColor(value),
        })
      }
    }
    return result
  }, [])

  const cellW = (PANEL_X_MAX - PANEL_X_MIN) / COLS
  const cellH = (PANEL_Y_MAX - PANEL_Y_MIN) / ROWS

  const handleClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const sy = VIEW_H / rect.height
    const px = (event.clientX - rect.left) * sx
    const py = (event.clientY - rect.top) * sy
    if (px < PANEL_X_MIN || px > PANEL_X_MAX || py < PANEL_Y_MIN || py > PANEL_Y_MAX) return
    const x = (px - ORIGIN_X) / UNIT_X
    const y = (ORIGIN_Y - py) / UNIT_Y
    const start = { x, y }
    const path = runDescent(start, STEPS)
    setRuns((cur) => [...cur.slice(-5), { start, path, outcome: classify(path[path.length - 1]) }])
  }, [])

  const reset = useCallback(() => {
    setRuns(
      PRESET_STARTS.map((s) => {
        const path = runDescent(s, STEPS)
        return { start: s, path, outcome: classify(path[path.length - 1]) }
      }),
    )
  }, [])

  const tally = useMemo(() => {
    const t: Record<Run['outcome'], number> = { 'left-min': 0, 'right-min': 0, saddle: 0, other: 0 }
    runs.forEach((r) => (t[r.outcome] += 1))
    return t
  }, [runs])

  const lastOutcome = runs[runs.length - 1]?.outcome
  const lastNarration =
    lastOutcome === 'saddle'
      ? 'The most recent run got stuck at the saddle point at the origin. This is a known failure mode: along the y-axis the gradient vanishes before reaching either basin.'
      : lastOutcome === 'left-min'
        ? 'The most recent run landed in the left basin, at minus one zero.'
        : lastOutcome === 'right-min'
          ? 'The most recent run landed in the right basin, at plus one zero.'
          : 'The most recent run is still descending.'

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Non-convex landscape with two minima at plus and minus one zero, and a saddle at the origin. ${tally['left-min']} run${tally['left-min'] === 1 ? '' : 's'} landed in the left basin, ${tally['right-min']} in the right, ${tally.saddle} at the saddle. ${lastNarration}`}
        priority="normal"
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto cursor-crosshair"
        role="img"
        aria-label={`Heatmap of f equals x to the fourth minus two x squared plus y squared. Two minima at plus and minus one zero with a saddle at the origin. ${runs.length} descent trajectories drawn.`}
        onClick={handleClick}
      >
        <text x={36} y={32} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          NON-CONVEX  ·  THE REAL WORLD
        </text>
        <text x={36} y={50} fontFamily="Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-ink)">
          f(x, y) = x⁴ &minus; 2x² + y² &nbsp;·&nbsp; click to drop a starting point
        </text>

        <rect
          x={PANEL_X_MIN}
          y={PANEL_Y_MIN}
          width={PANEL_X_MAX - PANEL_X_MIN}
          height={PANEL_Y_MAX - PANEL_Y_MIN}
          fill="var(--color-cream)"
        />

        <g>
          {cells.map((c, i) => (
            <rect key={i} x={c.x} y={c.y} width={cellW + 0.5} height={cellH + 0.5} fill={c.fill} />
          ))}
        </g>

        {/* Level curves of the double-well — three illustrative levels */}
        {[-0.5, 0.5, 2].map((lv) => {
          // No closed form; sample y on a fine x grid to draw isolines
          const pts: Array<string> = []
          for (let i = 0; i <= 200; i++) {
            const x = X_MIN + (i / 200) * (X_MAX - X_MIN)
            const inner = lv - (x * x * x * x - 2 * x * x)
            if (inner < 0) continue
            const yy = Math.sqrt(inner)
            if (yy > Y_MAX) continue
            const px = ORIGIN_X + x * UNIT_X
            const pyTop = ORIGIN_Y - yy * UNIT_Y
            const pyBot = ORIGIN_Y + yy * UNIT_Y
            pts.push(`M ${px} ${pyTop} L ${px} ${pyTop + 0.5}`)
            pts.push(`M ${px} ${pyBot} L ${px} ${pyBot + 0.5}`)
          }
          return (
            <path
              key={lv}
              d={pts.join(' ')}
              stroke="var(--color-graph-ink)"
              strokeWidth="0.6"
              strokeOpacity="0.4"
            />
          )
        })}

        <line x1={PANEL_X_MIN} y1={ORIGIN_Y} x2={PANEL_X_MAX} y2={ORIGIN_Y} stroke="var(--color-graph-ink)" strokeWidth="0.8" strokeOpacity="0.7" />
        <line x1={ORIGIN_X} y1={PANEL_Y_MIN} x2={ORIGIN_X} y2={PANEL_Y_MAX} stroke="var(--color-graph-ink)" strokeWidth="0.8" strokeOpacity="0.7" />

        {/* Minima markers */}
        {[
          { x: -1, label: 'min' },
          { x: 1, label: 'min' },
        ].map((m) => (
          <g key={m.x}>
            <circle cx={ORIGIN_X + m.x * UNIT_X} cy={ORIGIN_Y} r="6" fill="none" stroke="var(--color-cream)" strokeWidth="1.6" strokeDasharray="2 2" />
            <text x={ORIGIN_X + m.x * UNIT_X} y={ORIGIN_Y - 12} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="var(--color-cream)">
              ({m.x}, 0)
            </text>
          </g>
        ))}
        {/* Saddle marker */}
        <g>
          <rect x={ORIGIN_X - 6} y={ORIGIN_Y - 6} width="12" height="12" fill="none" stroke="var(--color-cream)" strokeWidth="1.6" strokeDasharray="2 2" />
          <text x={ORIGIN_X} y={ORIGIN_Y + 22} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="var(--color-cream)">
            saddle
          </text>
        </g>

        <clipPath id="nc-clip">
          <rect x={PANEL_X_MIN} y={PANEL_Y_MIN} width={PANEL_X_MAX - PANEL_X_MIN} height={PANEL_Y_MAX - PANEL_Y_MIN} />
        </clipPath>

        <g clipPath="url(#nc-clip)">
          {runs.map((r, i) => {
            const isLast = i === runs.length - 1
            const stroke =
              r.outcome === 'saddle'
                ? 'var(--color-dim)'
                : 'var(--color-vermilion)'
            const path = r.path
              .map((p, k) => {
                const px = ORIGIN_X + p.x * UNIT_X
                const py = ORIGIN_Y - p.y * UNIT_Y
                return `${k === 0 ? 'M' : 'L'} ${px} ${py}`
              })
              .join(' ')
            return (
              <g key={i}>
                <path d={path} fill="none" stroke={stroke} strokeWidth={isLast ? 1.8 : 1.1} strokeOpacity={isLast ? 0.95 : 0.45} />
                <circle
                  cx={ORIGIN_X + r.start.x * UNIT_X}
                  cy={ORIGIN_Y - r.start.y * UNIT_Y}
                  r="4"
                  fill="var(--color-cream)"
                  stroke={stroke}
                  strokeWidth="1.8"
                />
                <circle
                  cx={ORIGIN_X + r.path[r.path.length - 1].x * UNIT_X}
                  cy={ORIGIN_Y - r.path[r.path.length - 1].y * UNIT_Y}
                  r="3"
                  fill={stroke}
                />
              </g>
            )
          })}
        </g>

        {/* Tally */}
        <g transform={`translate(${VIEW_W - 36}, 36)`}>
          <text textAnchor="end" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            TALLY  ·  WHERE THEY LANDED
          </text>
          <text y="22" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-ink)">
            left = {tally['left-min']}
          </text>
          <text y="38" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-ink)">
            right = {tally['right-min']}
          </text>
          <text y="54" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-dim)">
            saddle = {tally.saddle}
          </text>
        </g>

        <text x="36" y={VIEW_H - 18} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          CLICK ANYWHERE  ·  WATCH WHERE IT LANDS
        </text>
      </svg>

      <div className="flex items-center justify-center gap-3 mt-3">
        <button
          type="button"
          onClick={reset}
          className="font-sans text-[12px] tracking-[0.12em] uppercase px-4 py-2 rounded-sm bg-cream-deep text-ink hover:bg-fade focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-cream transition-colors"
          aria-label="Reset to the three preset starting points."
        >
          Reset
        </button>
      </div>

      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4 &mdash; Gradient descent finds <em>a</em> minimum, not <em>the</em> minimum.
      </figcaption>
    </figure>
  )
}
