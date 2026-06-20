import { useCallback, useMemo, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Learning rate. The same x² + y² bowl heatmap. A slider for the
 * learning rate η from 0.01 to 1.2. Click "Run 20 steps" to roll out
 * a full trajectory at that η.
 *
 * Small η: slow, well-behaved convergence — a tidy spiral inward.
 * η ≈ 0.5: snaps to the minimum almost immediately.
 * η ≈ 1.0: bounces across the bowl, takes forever.
 * η > 1.0: each step grows; the ball spirals outward and diverges.
 *
 * The teaching is in the *shape* of the trajectory. The slider is
 * keyboard-nudgeable (0.01 steps, Shift = 0.1).
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

const STEPS = 20
const START = { x: -2.4, y: 1.5 }

const f = (x: number, y: number) => x * x + y * y
const F_MAX = X_MAX * X_MAX + Y_MAX * Y_MAX

const fmt = (n: number) => (n >= 0 ? ' ' : '') + n.toFixed(2)

const CELL_PX = 16
const COLS = Math.ceil((X_MAX - X_MIN) * UNIT / CELL_PX)
const ROWS = Math.ceil((Y_MAX - Y_MIN) * UNIT / CELL_PX)

const PANEL_X_MIN = ORIGIN_X + X_MIN * UNIT
const PANEL_X_MAX = ORIGIN_X + X_MAX * UNIT
const PANEL_Y_MIN = ORIGIN_Y - Y_MAX * UNIT
const PANEL_Y_MAX = ORIGIN_Y - Y_MIN * UNIT

const SLIDER_Y = VIEW_H - 40
const SLIDER_X_MIN = 110
const SLIDER_X_MAX = VIEW_W - 110
const ETA_MIN = 0.01
const ETA_MAX = 1.2

const etaToSliderX = (e: number) =>
  SLIDER_X_MIN + ((e - ETA_MIN) / (ETA_MAX - ETA_MIN)) * (SLIDER_X_MAX - SLIDER_X_MIN)
const sliderXToEta = (x: number) =>
  ETA_MIN + ((x - SLIDER_X_MIN) / (SLIDER_X_MAX - SLIDER_X_MIN)) * (ETA_MAX - ETA_MIN)

function heatColor(value: number): string {
  const t = Math.min(1, Math.max(0, value / F_MAX))
  const r1 = 243, g1 = 239, b1 = 230
  const r2 = 110, g2 = 28, b2 = 20
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r},${g},${b})`
}

function runDescent(eta: number, steps: number) {
  const path: Array<{ x: number; y: number }> = [START]
  let x = START.x
  let y = START.y
  for (let i = 0; i < steps; i++) {
    // x_{k+1} = x_k − η ∇f = (1 − 2η) x_k
    x = x - eta * 2 * x
    y = y - eta * 2 * y
    path.push({ x, y })
    if (!isFinite(x) || !isFinite(y) || Math.abs(x) > 50 || Math.abs(y) > 50) break
  }
  return path
}

function describe(eta: number): string {
  if (eta < 0.1) return 'tiny — slow but steady convergence'
  if (eta < 0.45) return 'a comfortable size — fast, clean convergence'
  if (eta < 0.55) return 'nearly optimal — close to a one-shot snap to the minimum'
  if (eta < 1.0) return 'a little too large — bounces, but still converges'
  if (eta < 1.05) return 'right at the boundary of stability'
  return 'too large — the steps grow, the ball spirals outward and diverges'
}

export function LearningRate() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const [eta, setEta] = useState(0.18)
  const [isInteracting, setIsInteracting] = useState(false)
  const startEtaRef = useRef<number | null>(null)

  const clamp = (v: number) => Math.max(ETA_MIN, Math.min(ETA_MAX, v))

  const bind = useDrag(({ first, last, movement: [mx] }) => {
    if (first) {
      startEtaRef.current = eta
      setIsInteracting(true)
    }
    if (last) setIsInteracting(false)
    const start = startEtaRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const startPx = etaToSliderX(start)
    const newPx = Math.max(SLIDER_X_MIN, Math.min(SLIDER_X_MAX, startPx + mx * sx))
    setEta(clamp(sliderXToEta(newPx)))
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const step = Math.abs(dx) >= 10 ? Math.sign(dx) * 0.1 : Math.sign(dx) * 0.01
        setEta((cur) => clamp(cur + step))
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

  const traj = useMemo(() => runDescent(eta, STEPS), [eta])

  const trajPath = traj
    .map((p, i) => {
      const px = ORIGIN_X + p.x * UNIT
      const py = ORIGIN_Y - p.y * UNIT
      const cx = Math.max(PANEL_X_MIN - 200, Math.min(PANEL_X_MAX + 200, px))
      const cy = Math.max(PANEL_Y_MIN - 200, Math.min(PANEL_Y_MAX + 200, py))
      return `${i === 0 ? 'M' : 'L'} ${cx} ${cy}`
    })
    .join(' ')

  const finalPt = traj[traj.length - 1]
  const finalValue = isFinite(finalPt.x) && isFinite(finalPt.y) ? f(finalPt.x, finalPt.y) : Infinity
  const diverged = finalValue > F_MAX * 1.2 || !isFinite(finalValue)

  const sliderHandleX = etaToSliderX(eta)
  const narrationText = `Learning rate η equals ${eta.toFixed(2)}. ${describe(eta)}. After ${STEPS} steps, f equals ${diverged ? 'diverged off the bowl' : fmt(finalValue).trim()}.`

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narrationText}
        priority={diverged ? 'high' : 'normal'}
        isInteracting={isInteracting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Heatmap of f of x y equals x squared plus y squared. A 20-step gradient descent trajectory at learning rate ${eta.toFixed(2)}.`}
      >
        <text x={36} y={32} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          LEARNING RATE  ·  HOW BIG A STEP
        </text>
        <text x={36} y={50} fontFamily="Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-ink)">
          x ← x &minus; η · ∇f &nbsp;·&nbsp; 20 steps
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

        {[0.5, 2, 5, 10].map((lv) => {
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
              strokeOpacity="0.35"
              strokeDasharray="3 4"
            />
          )
        })}

        <line x1={PANEL_X_MIN} y1={ORIGIN_Y} x2={PANEL_X_MAX} y2={ORIGIN_Y} stroke="var(--color-graph-ink)" strokeWidth="0.8" strokeOpacity="0.7" />
        <line x1={ORIGIN_X} y1={PANEL_Y_MIN} x2={ORIGIN_X} y2={PANEL_Y_MAX} stroke="var(--color-graph-ink)" strokeWidth="0.8" strokeOpacity="0.7" />

        {/* Clip the trajectory so divergent excursions don't blow out the SVG */}
        <clipPath id="lr-panel-clip">
          <rect x={PANEL_X_MIN} y={PANEL_Y_MIN} width={PANEL_X_MAX - PANEL_X_MIN} height={PANEL_Y_MAX - PANEL_Y_MIN} />
        </clipPath>

        <g clipPath="url(#lr-panel-clip)">
          <path d={trajPath} fill="none" stroke="var(--color-vermilion)" strokeWidth="1.6" strokeOpacity="0.85" />
          {traj.map((p, i) => {
            const px = ORIGIN_X + p.x * UNIT
            const py = ORIGIN_Y - p.y * UNIT
            return (
              <circle
                key={i}
                cx={px}
                cy={py}
                r={i === 0 ? 4 : i === traj.length - 1 ? 5 : 2}
                fill={i === 0 ? 'var(--color-cream)' : 'var(--color-vermilion)'}
                stroke={i === 0 ? 'var(--color-vermilion)' : 'none'}
                strokeWidth={i === 0 ? 2 : 0}
              />
            )
          })}
        </g>

        {/* Readout */}
        <g transform={`translate(${VIEW_W - 36}, 36)`}>
          <text textAnchor="end" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            η  ·  FINAL f
          </text>
          <text y="22" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-vermilion)">
            η = {eta.toFixed(2)}
          </text>
          <text y="42" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-ink)">
            f₂₀ = {diverged ? '∞' : fmt(finalValue).trim()}
          </text>
        </g>

        {/* Slider */}
        <g>
          <line x1={SLIDER_X_MIN} y1={SLIDER_Y} x2={SLIDER_X_MAX} y2={SLIDER_Y} stroke="var(--color-graph-ink)" strokeWidth="1.2" />
          {[0.01, 0.25, 0.5, 0.75, 1.0, 1.2].map((v) => (
            <g key={v}>
              <line x1={etaToSliderX(v)} y1={SLIDER_Y - 5} x2={etaToSliderX(v)} y2={SLIDER_Y + 5} stroke="var(--color-graph-ink)" strokeWidth="1" />
              <text x={etaToSliderX(v)} y={SLIDER_Y + 20} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-dim)">
                {v}
              </text>
            </g>
          ))}
          <g
            {...bind()}
            ref={handleRef}
            tabIndex={0}
            role="slider"
            aria-label={`Learning rate η. Current value ${eta.toFixed(2)}. Arrow keys to nudge by 0.01, shift plus arrow by 0.1.`}
            aria-valuemin={ETA_MIN}
            aria-valuemax={ETA_MAX}
            aria-valuenow={Number(eta.toFixed(2))}
            style={{ cursor: 'grab', touchAction: 'none' }}
            className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
          >
            <circle cx={sliderHandleX} cy={SLIDER_Y} r="22" fill="transparent" />
            <circle cx={sliderHandleX} cy={SLIDER_Y} r="8" fill="var(--color-vermilion)" stroke="var(--color-cream)" strokeWidth="2" />
          </g>
          <text x={SLIDER_X_MIN} y={SLIDER_Y - 14} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            DRAG  ·  ARROWS NUDGE  ·  η
          </text>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2 &mdash; Small η is slow. Large η bounces. Too large diverges.
      </figcaption>
    </figure>
  )
}
