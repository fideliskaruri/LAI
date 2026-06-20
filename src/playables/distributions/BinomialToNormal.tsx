import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Binomial → Normal. Same coin-flip scene, p fixed at 0.5, n on a log
 * slider from 4 up to 400. As n grows, the histogram bars sharpen onto
 * a vermilion Gaussian curve with μ = np and σ² = np(1-p).
 *
 * The teaching: de Moivre (1733) noticed this; Laplace generalised it.
 * The bars and the curve agree because, in the limit, they are the same.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

const PLOT_LEFT = 70
const PLOT_RIGHT = 540
const PLOT_BOTTOM = 320
const PLOT_TOP = 100
const PLOT_W = PLOT_RIGHT - PLOT_LEFT
const PLOT_H = PLOT_BOTTOM - PLOT_TOP

const SLIDER_Y = 410
const SLIDER_LEFT = PLOT_LEFT
const SLIDER_RIGHT = PLOT_RIGHT
const N_MIN = 4
const N_MAX = 400
const P_FIXED = 0.5

// Log-scale slider so each step shows visible change.
const nToSliderX = (n: number) =>
  SLIDER_LEFT + (Math.log(n / N_MIN) / Math.log(N_MAX / N_MIN)) * (SLIDER_RIGHT - SLIDER_LEFT)
const sliderXToN = (x: number) => {
  const t = (x - SLIDER_LEFT) / (SLIDER_RIGHT - SLIDER_LEFT)
  const clamped = Math.max(0, Math.min(1, t))
  return Math.round(N_MIN * Math.exp(clamped * Math.log(N_MAX / N_MIN)))
}

// Lanczos log-gamma (same as Binomial.tsx — duplicated here so each
// playable stands alone without a shared util that the user said not to
// touch).
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
function logBinomCoef(n: number, k: number): number {
  return lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1)
}
function binomPmf(n: number, k: number, p: number): number {
  if (p <= 0) return k === 0 ? 1 : 0
  if (p >= 1) return k === n ? 1 : 0
  return Math.exp(logBinomCoef(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p))
}
function gaussianPdf(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI))
}

function narrate(n: number): { text: string; priority: 'normal' | 'high' } {
  const mu = n * P_FIXED
  const sigma = Math.sqrt(n * P_FIXED * (1 - P_FIXED))
  if (n <= 6) {
    return {
      text: `With just ${n} flips, the histogram is clearly a sequence of discrete bars. The vermilion bell curve overlay shows what it would look like in the continuous limit. They don't match yet.`,
      priority: 'high',
    }
  }
  if (n >= 100) {
    return {
      text: `${n} flips. The histogram tops trace the vermilion Gaussian almost exactly. Mean ${mu.toFixed(1)}, standard deviation ${sigma.toFixed(2)}. The binomial has become normal in everything but its discreteness.`,
      priority: 'high',
    }
  }
  return {
    text: `${n} flips. The bars are rounding toward the vermilion bell curve — Gaussian, mean ${mu.toFixed(1)}, sigma ${sigma.toFixed(2)}. Drag the slider higher to watch them snap together.`,
    priority: 'normal',
  }
}

export function BinomialToNormal() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const sliderHandleRef = useRef<SVGGElement | null>(null)
  const [n, setN] = useState(16)
  const [isInteracting, setIsInteracting] = useState(false)
  const startNRef = useRef<number | null>(null)

  const updateN = useCallback((v: number) => setN(Math.max(N_MIN, Math.min(N_MAX, Math.round(v)))), [])

  const bindN = useDrag(({ first, last, movement: [mx] }) => {
    if (first) startNRef.current = n
    const start = startNRef.current
    if (start === null) return
    setIsInteracting(!last)
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const dxSvg = mx * sx
    const startX = nToSliderX(start)
    const newX = Math.max(SLIDER_LEFT, Math.min(SLIDER_RIGHT, startX + dxSvg))
    updateN(sliderXToN(newX))
  })

  useKeyNudge(
    sliderHandleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const factor = Math.abs(dx) >= 10 ? 1.8 : 1.2
        updateN(dx > 0 ? n * factor : n / factor)
      },
      [n, updateN],
    ),
  )

  const mu = n * P_FIXED
  const variance = n * P_FIXED * (1 - P_FIXED)
  const sigma = Math.sqrt(variance)

  // Window the visualised k range to roughly mean ± 4σ so high-n distributions
  // stay readable. For low n we show the full 0..n range.
  const kMin = n <= 24 ? 0 : Math.max(0, Math.floor(mu - 4 * sigma))
  const kMax = n <= 24 ? n : Math.min(n, Math.ceil(mu + 4 * sigma))
  const kCount = kMax - kMin + 1
  const colW = PLOT_W / kCount

  const probs = Array.from({ length: kCount }, (_, i) => binomPmf(n, kMin + i, P_FIXED))
  // We render bars as PMF, and the Gaussian as PDF scaled to the bar-height
  // domain (the bin width is 1, so the PMF and PDF live on the same scale).
  const maxProb = Math.max(...probs, 1e-9)
  const barW = Math.max(1.0, colW - 1.5)

  const tickStep = Math.max(1, Math.round((kMax - kMin) / 6))
  const ticks: number[] = []
  for (let v = Math.ceil(kMin / tickStep) * tickStep; v <= kMax; v += tickStep) ticks.push(v)
  if (!ticks.includes(Math.round(mu))) ticks.push(Math.round(mu))
  ticks.sort((a, b) => a - b)

  const kToX = (k: number) => PLOT_LEFT + (k - kMin + 0.5) * colW

  // Build the Gaussian path (continuous overlay).
  function gaussPath(): string {
    const samples = 240
    const pts: string[] = []
    for (let i = 0; i <= samples; i++) {
      const t = i / samples
      const xK = kMin + t * (kMax - kMin)
      const pdf = gaussianPdf(xK, mu, sigma)
      const yPx = PLOT_BOTTOM - (pdf / maxProb) * PLOT_H * 0.92
      const xPx = PLOT_LEFT + (xK - kMin + 0.5) * colW
      pts.push(`${xPx.toFixed(2)},${yPx.toFixed(2)}`)
    }
    return `M ${pts[0]} L ${pts.slice(1).join(' L ')}`
  }

  const narration = narrate(n)
  const sliderX = nToSliderX(n)

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
        aria-label={`Binomial-to-normal convergence. ${n} flips at probability one-half. Mean ${mu.toFixed(1)}, sigma ${sigma.toFixed(2)}. The vermilion bell curve overlays the histogram.`}
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
          As n grows, the bars rise to meet a curve
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
        {probs.map((pr, i) => {
          const h = (pr / maxProb) * PLOT_H * 0.92
          const x = PLOT_LEFT + i * colW + (colW - barW) / 2
          return (
            <rect
              key={i}
              x={x}
              y={PLOT_BOTTOM - h}
              width={barW}
              height={h}
              fill="var(--color-ink)"
              fillOpacity={0.55}
              stroke="var(--color-graph-ink)"
              strokeWidth="0.3"
            />
          )
        })}

        {/* Gaussian overlay — fill + outline */}
        <path
          d={`${gaussPath()} L ${PLOT_RIGHT},${PLOT_BOTTOM} L ${PLOT_LEFT},${PLOT_BOTTOM} Z`}
          fill="var(--color-vermilion)"
          fillOpacity="0.08"
        />
        <path d={gaussPath()} fill="none" stroke="var(--color-vermilion)" strokeWidth="1.8" />

        {/* X-axis ticks */}
        {ticks.map((v) => (
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
          k — NUMBER OF HEADS
        </text>

        {/* Mean marker */}
        <line
          x1={kToX(mu)}
          y1={PLOT_TOP - 4}
          x2={kToX(mu)}
          y2={PLOT_BOTTOM}
          stroke="var(--color-vermilion)"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.7"
        />
        <text
          x={kToX(mu)}
          y={PLOT_TOP - 8}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          fill="var(--color-vermilion)"
        >
          μ = np = {mu.toFixed(1)}
        </text>

        {/* Readout */}
        <g transform="translate(36, 70)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            BINOMIAL → GAUSSIAN
          </text>
          <text y={20} fontFamily="JetBrains Mono, monospace" fontSize="13" fill="var(--color-ink)">
            n = {n},  p = 0.50
          </text>
          <text y={38} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-vermilion)">
            μ = {mu.toFixed(2)}
          </text>
          <text y={54} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-vermilion)">
            σ = {sigma.toFixed(2)}
          </text>
        </g>

        {/* Slider */}
        <g>
          <text
            x={SLIDER_LEFT}
            y={SLIDER_Y - 12}
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            FLIPS  n = {n}  (LOG SCALE)
          </text>
          <line
            x1={SLIDER_LEFT}
            y1={SLIDER_Y}
            x2={SLIDER_RIGHT}
            y2={SLIDER_Y}
            stroke="var(--color-graph-ink)"
            strokeWidth="1.2"
          />
          {[4, 16, 64, 200, 400].map((v) => (
            <g key={v}>
              <line
                x1={nToSliderX(v)}
                y1={SLIDER_Y - 4}
                x2={nToSliderX(v)}
                y2={SLIDER_Y + 4}
                stroke="var(--color-graph-ink)"
                strokeWidth="0.8"
              />
              <text
                x={nToSliderX(v)}
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
            {...bindN()}
            ref={sliderHandleRef}
            tabIndex={0}
            role="slider"
            aria-label={`Number of flips n. Currently ${n}. Drag or arrow-key (Shift for larger steps).`}
            aria-valuemin={N_MIN}
            aria-valuemax={N_MAX}
            aria-valuenow={n}
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
          DRAG · ARROW KEYS NUDGE · BARS SHARPEN ONTO THE VERMILION BELL
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 2 — De Moivre's limit: discrete becomes continuous
      </figcaption>
    </figure>
  )
}
