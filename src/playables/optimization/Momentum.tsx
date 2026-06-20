import { useCallback, useMemo, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Momentum. An anisotropic bowl, f(x, y) = 0.5 x² + 5 y² — a stretched
 * canyon: shallow along x, steep along y. Vanilla gradient descent
 * bounces side-to-side across the narrow direction while crawling along
 * the long one. Momentum carries through the bouncing and rolls along
 * the canyon floor.
 *
 * Side-by-side trajectories: vanilla GD (faded vermilion) and GD with
 * momentum (vivid vermilion). β slider from 0 to 0.95. At β = 0 the two
 * traces overlap; at β ≈ 0.9 the momentum trajectory clearly rolls.
 *
 * The Hessian eigenvalues here are 1 and 10, so the condition number is
 * 10 — bad enough to make the asymmetry visible.
 */

const VIEW_W = 600
const VIEW_H = 480

const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT_X = 80
const UNIT_Y = 200 // bigger so the y-axis range is small in math units

const X_MIN = -3.2
const X_MAX = 3.2
const Y_MIN = -1.0
const Y_MAX = 1.0

const f = (x: number, y: number) => 0.5 * x * x + 5 * y * y
const gradF = (x: number, y: number) => ({ gx: x, gy: 10 * y })
const F_MAX = 0.5 * X_MAX * X_MAX + 5 * Y_MAX * Y_MAX

const STEPS = 40
const ETA = 0.18 // stable for the larger eigenvalue (η ≤ 2/10 = 0.2)
const START = { x: -2.8, y: 0.85 }

const fmt = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(2)

const CELL_PX = 14
const COLS = Math.ceil((X_MAX - X_MIN) * UNIT_X / CELL_PX)
const ROWS = Math.ceil((Y_MAX - Y_MIN) * UNIT_Y / CELL_PX)

const PANEL_X_MIN = ORIGIN_X + X_MIN * UNIT_X
const PANEL_X_MAX = ORIGIN_X + X_MAX * UNIT_X
const PANEL_Y_MIN = ORIGIN_Y - Y_MAX * UNIT_Y
const PANEL_Y_MAX = ORIGIN_Y - Y_MIN * UNIT_Y

const SLIDER_Y = VIEW_H - 36
const SLIDER_X_MIN = 110
const SLIDER_X_MAX = VIEW_W - 110
const BETA_MIN = 0
const BETA_MAX = 0.95

const betaToSliderX = (b: number) =>
  SLIDER_X_MIN + ((b - BETA_MIN) / (BETA_MAX - BETA_MIN)) * (SLIDER_X_MAX - SLIDER_X_MIN)
const sliderXToBeta = (x: number) =>
  BETA_MIN + ((x - SLIDER_X_MIN) / (SLIDER_X_MAX - SLIDER_X_MIN)) * (BETA_MAX - BETA_MIN)

function heatColor(value: number): string {
  const t = Math.min(1, Math.max(0, value / F_MAX))
  const r1 = 243, g1 = 239, b1 = 230
  const r2 = 110, g2 = 28, b2 = 20
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r},${g},${b})`
}

function runMomentum(beta: number, steps: number) {
  const path: Array<{ x: number; y: number }> = [START]
  let x = START.x
  let y = START.y
  let vx = 0
  let vy = 0
  for (let i = 0; i < steps; i++) {
    const { gx, gy } = gradF(x, y)
    vx = beta * vx - ETA * gx
    vy = beta * vy - ETA * gy
    x = x + vx
    y = y + vy
    path.push({ x, y })
    if (!isFinite(x) || !isFinite(y) || Math.abs(x) > 50 || Math.abs(y) > 50) break
  }
  return path
}

export function Momentum() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const [beta, setBeta] = useState(0.9)
  const [isInteracting, setIsInteracting] = useState(false)
  const startBetaRef = useRef<number | null>(null)

  const clamp = (v: number) => Math.max(BETA_MIN, Math.min(BETA_MAX, v))

  const bind = useDrag(({ first, last, movement: [mx] }) => {
    if (first) {
      startBetaRef.current = beta
      setIsInteracting(true)
    }
    if (last) setIsInteracting(false)
    const start = startBetaRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const startPx = betaToSliderX(start)
    const newPx = Math.max(SLIDER_X_MIN, Math.min(SLIDER_X_MAX, startPx + mx * sx))
    setBeta(clamp(sliderXToBeta(newPx)))
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const step = Math.abs(dx) >= 10 ? Math.sign(dx) * 0.05 : Math.sign(dx) * 0.01
        setBeta((cur) => clamp(cur + step))
      },
      [],
    ),
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

  const vanilla = useMemo(() => runMomentum(0, STEPS), [])
  const withMomentum = useMemo(() => runMomentum(beta, STEPS), [beta])

  const toPath = (traj: Array<{ x: number; y: number }>) =>
    traj
      .map((p, i) => {
        const px = ORIGIN_X + p.x * UNIT_X
        const py = ORIGIN_Y - p.y * UNIT_Y
        return `${i === 0 ? 'M' : 'L'} ${px} ${py}`
      })
      .join(' ')

  const finalMom = withMomentum[withMomentum.length - 1]
  const finalMomValue = isFinite(finalMom.x) && isFinite(finalMom.y) ? f(finalMom.x, finalMom.y) : Infinity
  const finalVanillaValue = f(vanilla[vanilla.length - 1].x, vanilla[vanilla.length - 1].y)
  const speedup = finalVanillaValue > 0 ? finalVanillaValue / Math.max(finalMomValue, 1e-6) : 1

  const sliderHandleX = betaToSliderX(beta)

  const narrationText =
    beta < 0.05
      ? `β equals ${beta.toFixed(2)}. Momentum is off; the two trajectories overlap. The path zig-zags across the narrow direction.`
      : `β equals ${beta.toFixed(2)}. With momentum the trajectory rolls along the canyon floor. After ${STEPS} steps it has reduced f by ${speedup.toFixed(1)} times more than vanilla.`

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narrationText}
        priority="normal"
        isInteracting={isInteracting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Heatmap of an elongated bowl f equals 0.5 x squared plus 5 y squared. Vanilla gradient descent shown faded; gradient descent with momentum β equals ${beta.toFixed(2)} shown in vermilion.`}
      >
        <text x={36} y={32} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          MOMENTUM  ·  ROLLING THROUGH A CANYON
        </text>
        <text x={36} y={50} fontFamily="Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-ink)">
          f(x, y) = ½ x² + 5 y² &nbsp;·&nbsp; v ← β v &minus; η ∇f &nbsp;·&nbsp; x ← x + v
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

        {/* Level curves — ellipses 0.5 x² + 5 y² = lv */}
        {[0.5, 2, 4].map((lv) => {
          const rx = Math.sqrt(2 * lv) * UNIT_X
          const ry = Math.sqrt(lv / 5) * UNIT_Y
          return (
            <ellipse
              key={lv}
              cx={ORIGIN_X}
              cy={ORIGIN_Y}
              rx={rx}
              ry={ry}
              fill="none"
              stroke="var(--color-graph-ink)"
              strokeWidth="0.6"
              strokeOpacity="0.35"
              strokeDasharray="3 4"
            />
          )
        })}

        <line x1={PANEL_X_MIN} y1={ORIGIN_Y} x2={PANEL_X_MAX} y2={ORIGIN_Y} stroke="var(--color-graph-ink)" strokeWidth="0.8" strokeOpacity="0.7" />
        <line x1={ORIGIN_X} y1={PANEL_Y_MIN} x2={ORIGIN_X} y2={PANEL_Y_MAX} stroke="var(--color-graph-ink)" strokeWidth="0.8" strokeOpacity="0.7" />

        <clipPath id="mom-clip">
          <rect x={PANEL_X_MIN} y={PANEL_Y_MIN} width={PANEL_X_MAX - PANEL_X_MIN} height={PANEL_Y_MAX - PANEL_Y_MIN} />
        </clipPath>

        <g clipPath="url(#mom-clip)">
          {/* Vanilla — faded */}
          <path d={toPath(vanilla)} fill="none" stroke="var(--color-vermilion)" strokeWidth="1.1" strokeOpacity="0.35" />
          {vanilla.map((p, i) => (
            <circle
              key={`v-${i}`}
              cx={ORIGIN_X + p.x * UNIT_X}
              cy={ORIGIN_Y - p.y * UNIT_Y}
              r="1.6"
              fill="var(--color-vermilion)"
              fillOpacity="0.35"
            />
          ))}
          {/* Momentum — vivid */}
          <path d={toPath(withMomentum)} fill="none" stroke="var(--color-vermilion)" strokeWidth="1.8" />
          {withMomentum.map((p, i) => (
            <circle
              key={`m-${i}`}
              cx={ORIGIN_X + p.x * UNIT_X}
              cy={ORIGIN_Y - p.y * UNIT_Y}
              r="2"
              fill="var(--color-vermilion)"
            />
          ))}
          {/* Start marker */}
          <circle
            cx={ORIGIN_X + START.x * UNIT_X}
            cy={ORIGIN_Y - START.y * UNIT_Y}
            r="5"
            fill="var(--color-cream)"
            stroke="var(--color-vermilion)"
            strokeWidth="2"
          />
        </g>

        {/* Legend */}
        <g transform={`translate(${VIEW_W - 196}, 74)`}>
          <line x1="0" y1="6" x2="22" y2="6" stroke="var(--color-vermilion)" strokeWidth="1.1" strokeOpacity="0.35" />
          <text x="28" y="10" fontFamily="Inter, sans-serif" fontSize="10" fill="var(--color-dim)">
            vanilla GD (β = 0)
          </text>
          <line x1="0" y1="24" x2="22" y2="24" stroke="var(--color-vermilion)" strokeWidth="1.8" />
          <text x="28" y="28" fontFamily="Inter, sans-serif" fontSize="10" fill="var(--color-dim)">
            with momentum
          </text>
        </g>

        {/* Readout */}
        <g transform={`translate(${VIEW_W - 36}, 36)`}>
          <text textAnchor="end" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            β  ·  FINAL f
          </text>
          <text y="22" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-vermilion)">
            β = {beta.toFixed(2)}
          </text>
          <text y="42" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-ink)">
            f₄₀(vanilla) = {fmt(finalVanillaValue).trim()}
          </text>
          <text y="58" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-vermilion)">
            f₄₀(momentum) = {fmt(finalMomValue).trim()}
          </text>
        </g>

        {/* Slider */}
        <g>
          <line x1={SLIDER_X_MIN} y1={SLIDER_Y} x2={SLIDER_X_MAX} y2={SLIDER_Y} stroke="var(--color-graph-ink)" strokeWidth="1.2" />
          {[0, 0.25, 0.5, 0.75, 0.9, 0.95].map((v) => (
            <g key={v}>
              <line x1={betaToSliderX(v)} y1={SLIDER_Y - 5} x2={betaToSliderX(v)} y2={SLIDER_Y + 5} stroke="var(--color-graph-ink)" strokeWidth="1" />
              <text x={betaToSliderX(v)} y={SLIDER_Y + 20} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-dim)">
                {v}
              </text>
            </g>
          ))}
          <g
            {...bind()}
            ref={handleRef}
            tabIndex={0}
            role="slider"
            aria-label={`Momentum coefficient β. Current value ${beta.toFixed(2)}. Arrow keys to nudge by 0.01.`}
            aria-valuemin={BETA_MIN}
            aria-valuemax={BETA_MAX}
            aria-valuenow={Number(beta.toFixed(2))}
            style={{ cursor: 'grab', touchAction: 'none' }}
            className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
          >
            <circle cx={sliderHandleX} cy={SLIDER_Y} r="22" fill="transparent" />
            <circle cx={sliderHandleX} cy={SLIDER_Y} r="8" fill="var(--color-vermilion)" stroke="var(--color-cream)" strokeWidth="2" />
          </g>
          <text x={SLIDER_X_MIN} y={SLIDER_Y - 14} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            DRAG  ·  ARROWS NUDGE  ·  β
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3 &mdash; Momentum rolls through bouncing.
      </figcaption>
    </figure>
  )
}
