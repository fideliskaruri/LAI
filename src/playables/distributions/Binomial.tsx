import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * The binomial distribution. Slider for n (number of flips, 1..40) and
 * slider for p (probability of heads, 0..1). A histogram shows
 *
 *     P(K = k) = C(n, k) p^k (1 - p)^(n-k),  k = 0..n
 *
 * with the bar at the mean np highlighted in vermilion. Sidebar readout
 * for mean (np) and variance (np(1-p)).
 *
 * The teaching: a coin flipped many times produces a *shape* — not a
 * single answer — and that shape already wants to be a bell.
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

// Two sliders, side-by-side at the bottom of the canvas.
const SLIDER_Y_N = 400
const SLIDER_Y_P = 440
const SLIDER_LEFT = PLOT_LEFT
const SLIDER_RIGHT = PLOT_RIGHT

const N_MIN = 1
const N_MAX = 40
const P_MIN = 0
const P_MAX = 1

const nToSliderX = (n: number) =>
  SLIDER_LEFT + ((n - N_MIN) / (N_MAX - N_MIN)) * (SLIDER_RIGHT - SLIDER_LEFT)
const sliderXToN = (x: number) => {
  const t = (x - SLIDER_LEFT) / (SLIDER_RIGHT - SLIDER_LEFT)
  return Math.max(N_MIN, Math.min(N_MAX, Math.round(N_MIN + t * (N_MAX - N_MIN))))
}
const pToSliderX = (p: number) =>
  SLIDER_LEFT + ((p - P_MIN) / (P_MAX - P_MIN)) * (SLIDER_RIGHT - SLIDER_LEFT)
const sliderXToP = (x: number) => {
  const t = (x - SLIDER_LEFT) / (SLIDER_RIGHT - SLIDER_LEFT)
  return Math.max(P_MIN, Math.min(P_MAX, t))
}

// Log-gamma for numerically-stable binomial coefficients at large n.
function lgamma(x: number): number {
  // Lanczos approximation (good to ~15 digits for x > 0).
  const g = 7
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ]
  if (x < 0.5) {
    // Reflection
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
  const logP =
    logBinomCoef(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p)
  return Math.exp(logP)
}

function narrate(n: number, p: number): { text: string; priority: 'normal' | 'high' } {
  const mu = n * p
  const sigma = Math.sqrt(n * p * (1 - p))
  if (n >= 20 && sigma > 1.5) {
    return {
      text: `${n} flips with probability ${p.toFixed(2)} of heads. The histogram is already bell-shaped, centred near ${mu.toFixed(1)} with a spread of about ${sigma.toFixed(2)}. Push n higher and the shape gets smoother.`,
      priority: 'normal',
    }
  }
  if (p < 0.05 || p > 0.95) {
    return {
      text: `Probability ${p.toFixed(2)} is extreme: most flips will land on one side. The histogram is heavily skewed, with mean ${mu.toFixed(2)}.`,
      priority: 'high',
    }
  }
  return {
    text: `${n} flip${n === 1 ? '' : 's'}, probability of heads ${p.toFixed(2)}. The histogram shows the chance of getting k heads, for k from zero to ${n}. Mean ${mu.toFixed(2)}, standard deviation ${sigma.toFixed(2)}.`,
    priority: 'normal',
  }
}

export function Binomial() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const nHandleRef = useRef<SVGGElement | null>(null)
  const pHandleRef = useRef<SVGGElement | null>(null)
  const [n, setN] = useState(20)
  const [p, setP] = useState(0.5)
  const [isInteracting, setIsInteracting] = useState(false)

  const startNRef = useRef<number | null>(null)
  const startPRef = useRef<number | null>(null)

  const updateN = useCallback((v: number) => setN(Math.max(N_MIN, Math.min(N_MAX, Math.round(v)))), [])
  const updateP = useCallback((v: number) => setP(Math.max(P_MIN, Math.min(P_MAX, v))), [])

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
  const bindP = useDrag(({ first, last, movement: [mx] }) => {
    if (first) startPRef.current = p
    const start = startPRef.current
    if (start === null) return
    setIsInteracting(!last)
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const dxSvg = mx * sx
    const startX = pToSliderX(start)
    const newX = Math.max(SLIDER_LEFT, Math.min(SLIDER_RIGHT, startX + dxSvg))
    updateP(sliderXToP(newX))
  })

  useKeyNudge(
    nHandleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const step = Math.abs(dx) >= 10 ? 5 : 1
        updateN(n + Math.sign(dx) * step)
      },
      [n, updateN],
    ),
  )
  useKeyNudge(
    pHandleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const step = Math.abs(dx) >= 10 ? 0.1 : 0.02
        updateP(p + Math.sign(dx) * step)
      },
      [p, updateP],
    ),
  )

  const mu = n * p
  const variance = n * p * (1 - p)
  const sigma = Math.sqrt(variance)

  // Build probabilities for k = 0..n
  const probs = Array.from({ length: n + 1 }, (_, k) => binomPmf(n, k, p))
  const maxProb = Math.max(...probs, 1e-9)
  // Bar geometry: distribute n+1 bars across PLOT_W with at least 1px gap.
  const colW = PLOT_W / (n + 1)
  const barW = Math.max(1.2, colW - 1.5)
  const meanBarIdx = Math.round(mu)

  // X-axis ticks: 0, n/4, n/2, 3n/4, n (rounded).
  const tickVals = Array.from(new Set([0, Math.round(n / 4), Math.round(n / 2), Math.round((3 * n) / 4), n]))
  const tickX = (k: number) => PLOT_LEFT + (k + 0.5) * colW

  const narration = narrate(n, p)

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
        aria-label={`Binomial distribution histogram. n equals ${n} flips, probability of heads ${p.toFixed(2)}. Mean ${mu.toFixed(2)}, standard deviation ${sigma.toFixed(2)}.`}
      >
        <g aria-hidden="true" data-origin-x={ORIGIN_X} data-origin-y={ORIGIN_Y} data-unit={UNIT} />

        {/* Title */}
        <text
          x={VIEW_W / 2}
          y={50}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="15"
          fill="var(--color-ink)"
        >
          {n} flips of a coin — how many heads?
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
          const isMean = k === meanBarIdx && variance > 1e-9
          return (
            <rect
              key={k}
              x={x}
              y={PLOT_BOTTOM - h}
              width={barW}
              height={h}
              fill={isMean ? 'var(--color-vermilion)' : 'var(--color-ink)'}
              fillOpacity={isMean ? 0.9 : 0.7}
              stroke="var(--color-graph-ink)"
              strokeWidth="0.4"
            />
          )
        })}

        {/* X-axis ticks */}
        {tickVals.map((v) => (
          <g key={v}>
            <line
              x1={tickX(v)}
              y1={PLOT_BOTTOM}
              x2={tickX(v)}
              y2={PLOT_BOTTOM + 4}
              stroke="var(--color-graph-ink)"
              strokeWidth="0.8"
            />
            <text
              x={tickX(v)}
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

        {/* Mean marker — dotted vermilion line above the bars */}
        <line
          x1={PLOT_LEFT + (mu + 0.5) * colW}
          y1={PLOT_TOP - 4}
          x2={PLOT_LEFT + (mu + 0.5) * colW}
          y2={PLOT_BOTTOM}
          stroke="var(--color-vermilion)"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.7"
        />
        <text
          x={PLOT_LEFT + (mu + 0.5) * colW}
          y={PLOT_TOP - 8}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="10"
          fill="var(--color-vermilion)"
        >
          μ = {mu.toFixed(2)}
        </text>

        {/* Readout */}
        <g transform="translate(36, 70)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            BINOMIAL · n, p
          </text>
          <text y={20} fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-ink)">
            n = {n}, p = {p.toFixed(2)}
          </text>
          <text y={40} fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-vermilion)">
            μ = np = {mu.toFixed(2)}
          </text>
          <text y={58} fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-vermilion)">
            σ² = np(1−p) = {variance.toFixed(2)}
          </text>
        </g>

        {/* n slider */}
        <g>
          <text
            x={SLIDER_LEFT}
            y={SLIDER_Y_N - 12}
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            FLIPS  n = {n}
          </text>
          <line
            x1={SLIDER_LEFT}
            y1={SLIDER_Y_N}
            x2={SLIDER_RIGHT}
            y2={SLIDER_Y_N}
            stroke="var(--color-graph-ink)"
            strokeWidth="1.2"
          />
          {[1, 10, 20, 30, 40].map((v) => (
            <g key={v}>
              <line
                x1={nToSliderX(v)}
                y1={SLIDER_Y_N - 4}
                x2={nToSliderX(v)}
                y2={SLIDER_Y_N + 4}
                stroke="var(--color-graph-ink)"
                strokeWidth="0.8"
              />
              <text
                x={nToSliderX(v)}
                y={SLIDER_Y_N + 16}
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
            ref={nHandleRef}
            tabIndex={0}
            role="slider"
            aria-label={`Number of flips n. Currently ${n}. Drag or arrow-key to change.`}
            aria-valuemin={N_MIN}
            aria-valuemax={N_MAX}
            aria-valuenow={n}
            style={{ cursor: 'grab', touchAction: 'none' }}
            className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
          >
            <circle cx={nToSliderX(n)} cy={SLIDER_Y_N} r="20" fill="transparent" />
            <circle
              cx={nToSliderX(n)}
              cy={SLIDER_Y_N}
              r="7"
              fill="var(--color-vermilion)"
              stroke="var(--color-cream)"
              strokeWidth="2"
            />
          </g>
        </g>

        {/* p slider */}
        <g>
          <text
            x={SLIDER_LEFT}
            y={SLIDER_Y_P - 12}
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            P(HEADS)  p = {p.toFixed(2)}
          </text>
          <line
            x1={SLIDER_LEFT}
            y1={SLIDER_Y_P}
            x2={SLIDER_RIGHT}
            y2={SLIDER_Y_P}
            stroke="var(--color-graph-ink)"
            strokeWidth="1.2"
          />
          {[0, 0.25, 0.5, 0.75, 1].map((v) => (
            <g key={v}>
              <line
                x1={pToSliderX(v)}
                y1={SLIDER_Y_P - 4}
                x2={pToSliderX(v)}
                y2={SLIDER_Y_P + 4}
                stroke="var(--color-graph-ink)"
                strokeWidth="0.8"
              />
              <text
                x={pToSliderX(v)}
                y={SLIDER_Y_P + 16}
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
            {...bindP()}
            ref={pHandleRef}
            tabIndex={0}
            role="slider"
            aria-label={`Probability of heads p. Currently ${p.toFixed(2)}. Drag or arrow-key to change.`}
            aria-valuemin={P_MIN}
            aria-valuemax={P_MAX}
            aria-valuenow={Number(p.toFixed(2))}
            style={{ cursor: 'grab', touchAction: 'none' }}
            className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
          >
            <circle cx={pToSliderX(p)} cy={SLIDER_Y_P} r="20" fill="transparent" />
            <circle
              cx={pToSliderX(p)}
              cy={SLIDER_Y_P}
              r="7"
              fill="var(--color-vermilion)"
              stroke="var(--color-cream)"
              strokeWidth="2"
            />
          </g>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1 — The binomial: P(k heads in n flips)
      </figcaption>
    </figure>
  )
}
