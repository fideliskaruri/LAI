import { useCallback, useMemo, useRef, useState } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * The mountain-climber metaphor. A 2D heatmap of the paraboloid bowl
 * f(x, y) = x² + y², seen from above. A ball icon at some starting point.
 *
 * Click "step" — the ball takes one fixed-size step *against* the gradient
 * (downhill). Repeat. The trajectory accumulates as a faint vermilion path.
 * The reader watches the ball spiral toward the minimum at the origin.
 *
 * Keyboard: Enter/Space on the focused step button takes a step; R resets.
 */

const VIEW_W = 600
const VIEW_H = 480

const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

const X_MIN = -3
const X_MAX = 3
const Y_MIN = -2.4
const Y_MAX = 2.4

const f = (x: number, y: number) => x * x + y * y
const gradF = (x: number, y: number) => ({ gx: 2 * x, gy: 2 * y })
const F_MAX = X_MAX * X_MAX + Y_MAX * Y_MAX

// One step shrinks position by (1 − 2η) along each axis since ∇f = (2x, 2y).
// With η = 0.18 the ball converges in ~10–14 clicks from the corner.
const ETA = 0.18

const fmt = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(2)

const CELL_PX = 16
const COLS = Math.ceil((X_MAX - X_MIN) * UNIT / CELL_PX)
const ROWS = Math.ceil((Y_MAX - Y_MIN) * UNIT / CELL_PX)

const PANEL_X_MIN = ORIGIN_X + X_MIN * UNIT
const PANEL_X_MAX = ORIGIN_X + X_MAX * UNIT
const PANEL_Y_MIN = ORIGIN_Y - Y_MAX * UNIT
const PANEL_Y_MAX = ORIGIN_Y - Y_MIN * UNIT

function heatColor(value: number): string {
  const t = Math.min(1, Math.max(0, value / F_MAX))
  const r1 = 243, g1 = 239, b1 = 230
  const r2 = 110, g2 = 28, b2 = 20
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r},${g},${b})`
}

const INITIAL = { x: -2.4, y: 1.6 }

export function MountainClimber() {
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const [traj, setTraj] = useState<Array<{ x: number; y: number }>>([INITIAL])
  const [stepCount, setStepCount] = useState(0)

  const pt = traj[traj.length - 1]

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

  const step = useCallback(() => {
    setTraj((cur) => {
      const last = cur[cur.length - 1]
      const { gx, gy } = gradF(last.x, last.y)
      const nx = last.x - ETA * gx
      const ny = last.y - ETA * gy
      return [...cur, { x: nx, y: ny }]
    })
    setStepCount((c) => c + 1)
  }, [])

  const reset = useCallback(() => {
    setTraj([INITIAL])
    setStepCount(0)
  }, [])

  // Keyboard: arrows act as "step" (only when the trigger is focused).
  useKeyNudge(
    buttonRef,
    useCallback(() => {
      step()
    }, [step]),
  )

  const value = f(pt.x, pt.y)
  const { gx, gy } = gradF(pt.x, pt.y)

  const pPx = { x: ORIGIN_X + pt.x * UNIT, y: ORIGIN_Y - pt.y * UNIT }

  // The descent arrow: from current point, against the gradient, scaled.
  const tipMathX = pt.x - gx * 0.3
  const tipMathY = pt.y - gy * 0.3
  const tipPx = { x: ORIGIN_X + tipMathX * UNIT, y: ORIGIN_Y - tipMathY * UNIT }
  const ang = Math.atan2(tipPx.y - pPx.y, tipPx.x - pPx.x)
  const headLen = 10
  const headWide = 5
  const head1 = {
    x: tipPx.x - headLen * Math.cos(ang) + headWide * Math.cos(ang + Math.PI / 2),
    y: tipPx.y - headLen * Math.sin(ang) + headWide * Math.sin(ang + Math.PI / 2),
  }
  const head2 = {
    x: tipPx.x - headLen * Math.cos(ang) - headWide * Math.cos(ang + Math.PI / 2),
    y: tipPx.y - headLen * Math.sin(ang) - headWide * Math.sin(ang + Math.PI / 2),
  }

  const levelValues = [0.5, 2, 5, 10]

  // Trajectory path
  const trajPath = traj
    .map((p, i) => {
      const px = ORIGIN_X + p.x * UNIT
      const py = ORIGIN_Y - p.y * UNIT
      return `${i === 0 ? 'M' : 'L'} ${px} ${py}`
    })
    .join(' ')

  const atMin = Math.hypot(pt.x, pt.y) < 0.05
  const narrationText = atMin
    ? `After ${stepCount} steps the ball has effectively reached the minimum at the origin. f equals ${fmt(value).trim()}.`
    : stepCount === 0
      ? `The ball is at x equals ${fmt(pt.x).trim()}, y equals ${fmt(pt.y).trim()}. f equals ${fmt(value).trim()}. Press step to take a step against the gradient.`
      : `After ${stepCount} step${stepCount === 1 ? '' : 's'} the ball is at x equals ${fmt(pt.x).trim()}, y equals ${fmt(pt.y).trim()}. f equals ${fmt(value).trim()}. The descent arrow points toward the minimum at the origin.`

  return (
    <figure className="w-full">
      <CanvasNarrative text={narrationText} priority={atMin ? 'high' : 'normal'} />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Heatmap of f of x y equals x squared plus y squared seen from above. A ball at x equals ${fmt(pt.x).trim()}, y equals ${fmt(pt.y).trim()}. ${stepCount} step${stepCount === 1 ? '' : 's'} taken.`}
      >
        <text x={36} y={32} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          THE BOWL  ·  SEEN FROM ABOVE
        </text>
        <text x={36} y={50} fontFamily="Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-ink)">
          f(x, y) = x² + y² &nbsp;·&nbsp; step: x ← x &minus; η · 2x
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

        {levelValues.map((lv) => {
          const r = Math.sqrt(lv) * UNIT
          if (r > Math.max(PANEL_X_MAX - ORIGIN_X, PANEL_Y_MAX - ORIGIN_Y) + 30) return null
          return (
            <circle
              key={lv}
              cx={ORIGIN_X}
              cy={ORIGIN_Y}
              r={r}
              fill="none"
              stroke="var(--color-graph-ink)"
              strokeWidth="0.6"
              strokeOpacity="0.4"
              strokeDasharray="3 4"
            />
          )
        })}

        {/* Axes */}
        <line x1={PANEL_X_MIN} y1={ORIGIN_Y} x2={PANEL_X_MAX} y2={ORIGIN_Y} stroke="var(--color-graph-ink)" strokeWidth="0.8" strokeOpacity="0.7" />
        <line x1={ORIGIN_X} y1={PANEL_Y_MIN} x2={ORIGIN_X} y2={PANEL_Y_MAX} stroke="var(--color-graph-ink)" strokeWidth="0.8" strokeOpacity="0.7" />

        {/* Trajectory path */}
        {traj.length > 1 && (
          <path d={trajPath} fill="none" stroke="var(--color-vermilion)" strokeWidth="1.4" strokeOpacity="0.55" strokeDasharray="3 3" />
        )}
        {traj.slice(0, -1).map((p, i) => (
          <circle
            key={i}
            cx={ORIGIN_X + p.x * UNIT}
            cy={ORIGIN_Y - p.y * UNIT}
            r="2.5"
            fill="var(--color-vermilion)"
            fillOpacity="0.5"
          />
        ))}

        {/* Descent arrow */}
        {!atMin && (
          <>
            <line x1={pPx.x} y1={pPx.y} x2={tipPx.x} y2={tipPx.y} stroke="var(--color-vermilion)" strokeWidth="2.4" />
            <polygon points={`${tipPx.x},${tipPx.y} ${head1.x},${head1.y} ${head2.x},${head2.y}`} fill="var(--color-vermilion)" />
          </>
        )}

        {/* The ball */}
        <circle cx={pPx.x} cy={pPx.y} r="9" fill="var(--color-cream)" stroke="var(--color-vermilion)" strokeWidth="2.6" />
        <circle cx={pPx.x} cy={pPx.y} r="3" fill="var(--color-vermilion)" />

        {/* Readout */}
        <g transform={`translate(${VIEW_W - 36}, 36)`}>
          <text textAnchor="end" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            STEP  ·  POSITION  ·  f
          </text>
          <text y="22" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-ink)">
            n = {stepCount}
          </text>
          <text y="42" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-ink)">
            (x, y) = ({fmt(pt.x).trim()}, {fmt(pt.y).trim()})
          </text>
          <text y="62" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-vermilion)">
            f = {fmt(value).trim()}
          </text>
        </g>

        <text x="36" y={VIEW_H - 18} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          CLICK STEP  ·  THE BALL MOVES AGAINST THE GRADIENT
        </text>
      </svg>

      <div className="flex items-center justify-center gap-3 mt-3">
        <button
          ref={buttonRef}
          type="button"
          onClick={step}
          className="font-sans text-[12px] tracking-[0.12em] uppercase px-4 py-2 rounded-sm bg-vermilion text-cream hover:bg-vermilion-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-cream transition-colors"
          aria-label={`Take one gradient descent step. Currently ${stepCount} step${stepCount === 1 ? '' : 's'} taken.`}
        >
          Step
        </button>
        <button
          type="button"
          onClick={reset}
          className="font-sans text-[12px] tracking-[0.12em] uppercase px-4 py-2 rounded-sm bg-cream-deep text-ink hover:bg-fade focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-cream transition-colors"
          aria-label="Reset the ball to its starting position."
        >
          Reset
        </button>
      </div>

      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1 &mdash; In two dimensions you can see it; in a thousand you can't. The rule is the same.
      </figcaption>
    </figure>
  )
}
