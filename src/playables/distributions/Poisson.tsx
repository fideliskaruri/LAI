import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * The Poisson distribution. Slider for λ (mean rate). Histogram of
 *
 *     P(K = k) = e^(-λ) λ^k / k!,  k = 0, 1, 2, …
 *
 * At small λ the bars cluster near zero — rare events are mostly absent.
 * At large λ the histogram is approximately Gaussian centered at λ
 * (the Poisson limit theorem). A faint vermilion bell-curve guide
 * overlays the histogram when λ is large enough to make the comparison
 * legible.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

const PLOT_LEFT = 70
const PLOT_RIGHT = 540
const PLOT_TOP = 100
const PLOT_BOTTOM = 320
const PLOT_W = PLOT_RIGHT - PLOT_LEFT
const PLOT_H = PLOT_BOTTOM - PLOT_TOP

const SLIDER_Y = 410
const SLIDER_LEFT = PLOT_LEFT
const SLIDER_RIGHT = PLOT_RIGHT

const LAMBDA_MIN = 0.2
const LAMBDA_MAX = 30
// Log slider so small λ behaviour is visible.
const lambdaToSliderX = (l: number) =>
  SLIDER_LEFT + (Math.log(l / LAMBDA_MIN) / Math.log(LAMBDA_MAX / LAMBDA_MIN)) * (SLIDER_RIGHT - SLIDER_LEFT)
const sliderXToLambda = (x: number) => {
  const t = (x - SLIDER_LEFT) / (SLIDER_RIGHT - SLIDER_LEFT)
  const clamped = Math.max(0, Math.min(1, t))
  return LAMBDA_MIN * Math.exp(clamped * Math.log(LAMBDA_MAX / LAMBDA_MIN))
}

// Stable Poisson PMF via log space.
function lgamma(x: number): number {
  const g = 7
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ]
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x)
  }
  x -= 1
  let a = c[0]
  const t = x + g + 0.5
  for (let i = 1; i < 9; i++) a += c[i] / (x + i)
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a)
}
function poissonPmf(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0
  return Math.exp(-lambda + k * Math.log(lambda) - lgamma(k + 1))
}
function gaussianPdf(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI))
}

function narrate(lambda: number): { text: string; priority: 'normal' | 'high' } {
  if (lambda < 1) {
    return {
      text: `Lambda is ${lambda.toFixed(2)} — rare events. Most of the probability sits at zero; you usually see no event at all. A right-skewed shape.`,
      priority: 'high',
    }
  }
  if (lambda > 15) {
    return {
      text: `Lambda is ${lambda.toFixed(1)}. The Poisson histogram is almost indistinguishable from a Gaussian centred at lambda with standard deviation sqrt of lambda — about ${Math.sqrt(lambda).toFixed(2)}.`,
      priority: 'high',
    }
  }
  return {
    text: `Lambda equals ${lambda.toFixed(2)}. Mean and variance are both lambda. The most likely count is near ${Math.floor(lambda)}, but the long tail to the right means you occasionally see many more.`,
    priority: 'normal',
  }
}

export function Poisson() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const sliderHandleRef = useRef<SVGGElement | null>(null)
  const [lambda, setLambda] = useState(4)
  const [isInteracting, setIsInteracting] = useState(false)
  const startLambdaRef = useRef<number | null>(null)

  const updateLambda = useCallback((v: number) => {
    setLambda(Math.max(LAMBDA_MIN, Math.min(LAMBDA_MAX, v)))
  }, [])

  const bindLambda = useDrag(({ first, last, movement: [mx] }) => {
    if (first) startLambdaRef.current = lambda
    const start = startLambdaRef.current
    if (start === null) return
    setIsInteracting(!last)
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const dxSvg = mx * sx
    const startX = lambdaToSliderX(start)
    const newX = Math.max(SLIDER_LEFT, Math.min(SLIDER_RIGHT, startX + dxSvg))
    updateLambda(sliderXToLambda(newX))
  })

  useKeyNudge(
    sliderHandleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const factor = Math.abs(dx) >= 10 ? 1.5 : 1.15
        updateLambda(dx > 0 ? lambda * factor : lambda / factor)
      },
      [lambda, updateLambda],
    ),
  )

  // Render k = 0 .. kMax where kMax shows most mass.
  const sigma = Math.sqrt(lambda)
  const kMax = Math.max(8, Math.ceil(lambda + 4 * sigma))
  const kCount = kMax + 1
  const colW = PLOT_W / kCount

  const probs = Array.from({ length: kCount }, (_, k) => poissonPmf(k, lambda))
  const maxProb = Math.max(...probs, 1e-9)
  const barW = Math.max(1.2, colW - 1.5)

  // X-axis tick stride.
  const tickStride = kMax <= 12 ? 1 : kMax <= 24 ? 2 : 5
  const tickVals: number[] = []
  for (let v = 0; v <= kMax; v += tickStride) tickVals.push(v)
  if (!tickVals.includes(kMax)) tickVals.push(kMax)

  const kToX = (k: number) => PLOT_LEFT + (k + 0.5) * colW

  // Gaussian guide — only show when λ is large enough that the bell
  // shape is meaningful (small λ is too skewed for the analogy).
  const showGaussianGuide = lambda >= 5
  function gaussPath(): string {
    const samples = 240
    const pts: string[] = []
    for (let i = 0; i <= samples; i++) {
      const t = i / samples
      const xK = t * kMax
      const pdf = gaussianPdf(xK, lambda, sigma)
      const yPx = PLOT_BOTTOM - (pdf / maxProb) * PLOT_H * 0.92
      const xPx = PLOT_LEFT + (xK + 0.5) * colW
      pts.push(`${xPx.toFixed(2)},${yPx.toFixed(2)}`)
    }
    return `M ${pts[0]} L ${pts.slice(1).join(' L ')}`
  }

  const narration = narrate(lambda)
  const sliderX = lambdaToSliderX(lambda)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narration.text}
        priority={narration.priority}
        isInteracting={isInteracting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Poisson distribution histogram with rate lambda equal ${lambda.toFixed(2)}. Mean and variance both equal lambda.`}
      >
        <g aria-hidden="true" data-origin-x={ORIGIN_X} data-origin-y={ORIGIN_Y} data-unit={UNIT} />

        <text
          x={VIEW_W / 2}
          y={50}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="15"
          fill="var(--color-ink)"
        >
          Rare events arriving at rate λ
        </text>

        {/* Axis */}
        <line
          x1={PLOT_LEFT}
          y1={PLOT_BOTTOM}
          x2={PLOT_RIGHT}
          y2={PLOT_BOTTOM}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.2"
        />

        {/* Bars */}
        {probs.map((pr, k) => {
          const h = (pr / maxProb) * PLOT_H * 0.92
          const x = PLOT_LEFT + k * colW + (colW - barW) / 2
          const isNearMean = Math.abs(k - lambda) < 0.5
          return (
            <rect
              key={k}
              x={x}
              y={PLOT_BOTTOM - h}
              width={barW}
              height={h}
              fill={isNearMean ? 'var(--color-vermilion)' : 'var(--color-ink)'}
              fillOpacity={isNearMean ? 0.85 : 0.7}
              stroke="var(--color-graph-ink)"
              strokeWidth="0.4"
            />
          )
        })}

        {/* Gaussian guide — visible only at higher λ */}
        {showGaussianGuide && (
          <path
            d={gaussPath()}
            fill="none"
            stroke="var(--color-vermilion)"
            strokeWidth="1.2"
            strokeOpacity="0.6"
            strokeDasharray="4 3"
          />
        )}

        {/* λ marker */}
        <line
          x1={kToX(lambda)}
          y1={PLOT_TOP - 4}
          x2={kToX(lambda)}
          y2={PLOT_BOTTOM}
          stroke="var(--color-vermilion)"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.7"
        />
        <text
          x={kToX(lambda)}
          y={PLOT_TOP - 8}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          fill="var(--color-vermilion)"
        >
          λ = {lambda.toFixed(2)}
        </text>

        {/* X-axis ticks */}
        {tickVals.map((v) => (
          <g key={v}>
            <line
              x1={kToX(v)}
              y1={PLOT_BOTTOM}
              x2={kToX(v)}
              y2={PLOT_BOTTOM + 4}
              stroke="var(--color-graph-ink)"
              strokeWidth="0.8"
            />
            <text
              x={kToX(v)}
              y={PLOT_BOTTOM + 18}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
            >
              {v}
            </text>
          </g>
        ))}
        <text
          x={(PLOT_LEFT + PLOT_RIGHT) / 2}
          y={PLOT_BOTTOM + 34}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          k — NUMBER OF EVENTS
        </text>

        {/* Readout (left sidebar) */}
        <g transform="translate(36, 70)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            POISSON · λ
          </text>
          <text y={20} fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-vermilion)">
            λ = {lambda.toFixed(2)}
          </text>
          <text y={38} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-ink)">
            E[K]  = λ = {lambda.toFixed(2)}
          </text>
          <text y={54} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-ink)">
            Var[K]= λ = {lambda.toFixed(2)}
          </text>
        </g>

        {/* What λ models — right sidebar whisper */}
        <g transform="translate(396, 70)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            WHAT λ COUNTS
          </text>
          <text y={20} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="11" fill="var(--color-dim)">
            server requests per second,
          </text>
          <text y={36} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="11" fill="var(--color-dim)">
            radioactive decays per minute,
          </text>
          <text y={52} fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="11" fill="var(--color-dim)">
            mutations per gene per generation
          </text>
        </g>

        {/* λ slider */}
        <g>
          <text
            x={SLIDER_LEFT}
            y={SLIDER_Y - 12}
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            RATE λ  ·  {lambda.toFixed(2)}  (LOG SCALE)
          </text>
          <line
            x1={SLIDER_LEFT}
            y1={SLIDER_Y}
            x2={SLIDER_RIGHT}
            y2={SLIDER_Y}
            stroke="var(--color-graph-ink)"
            strokeWidth="1.2"
          />
          {[0.2, 1, 4, 10, 30].map((v) => (
            <g key={v}>
              <line
                x1={lambdaToSliderX(v)}
                y1={SLIDER_Y - 4}
                x2={lambdaToSliderX(v)}
                y2={SLIDER_Y + 4}
                stroke="var(--color-graph-ink)"
                strokeWidth="0.8"
              />
              <text
                x={lambdaToSliderX(v)}
                y={SLIDER_Y + 16}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="9"
                fill="var(--color-dim)"
              >
                {v}
              </text>
            </g>
          ))}
          <g
            {...bindLambda()}
            ref={sliderHandleRef}
            tabIndex={0}
            role="slider"
            aria-label={`Rate lambda. Currently ${lambda.toFixed(2)}. Drag or arrow-key, Shift for larger steps.`}
            aria-valuemin={LAMBDA_MIN}
            aria-valuemax={LAMBDA_MAX}
            aria-valuenow={Number(lambda.toFixed(2))}
            style={{ cursor: 'grab', touchAction: 'none' }}
            className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
          >
            <circle cx={sliderX} cy={SLIDER_Y} r="20" fill="transparent" />
            <circle
              cx={sliderX}
              cy={SLIDER_Y}
              r="7"
              fill="var(--color-vermilion)"
              stroke="var(--color-cream)"
              strokeWidth="2"
            />
          </g>
        </g>

        {/* Help text */}
        <text
          x={SLIDER_LEFT}
          y={VIEW_H - 18}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          SMALL λ → SPIKE AT ZERO · LARGE λ → APPROXIMATELY GAUSSIAN
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4 — Poisson: when events are rare and independent
      </figcaption>
    </figure>
  )
}
