import { useCallback, useRef, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * The normal distribution N(μ, σ²). Two sliders — μ for the centre,
 * σ for the spread. The bell slides and stretches. Shaded vermilion
 * bands at ±1σ, ±2σ, ±3σ to make the 68/95/99 rule visible. Formula
 * f(x) = (1/√(2πσ²)) exp(-(x-μ)²/(2σ²)) rendered in the corner.
 *
 * x-axis is in the same world coordinates as μ; the canvas reframes
 * around μ but the unit scale stays fixed so σ changes are felt as
 * width changes rather than just rescaling.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

const PLOT_LEFT = 60
const PLOT_RIGHT = 540
const PLOT_TOP = 110
const PLOT_BOTTOM = 320
const PLOT_W = PLOT_RIGHT - PLOT_LEFT
const PLOT_H = PLOT_BOTTOM - PLOT_TOP

// World x-coordinates: -10 .. +10
const X_MIN = -10
const X_MAX = 10
const xToPx = (x: number) => PLOT_LEFT + ((x - X_MIN) / (X_MAX - X_MIN)) * PLOT_W

// Two sliders.
const SLIDER_Y_MU = 400
const SLIDER_Y_SIG = 440
const SLIDER_LEFT = PLOT_LEFT
const SLIDER_RIGHT = PLOT_RIGHT

const MU_MIN = -6
const MU_MAX = 6
const SIG_MIN = 0.4
const SIG_MAX = 4

const muToSliderX = (m: number) =>
  SLIDER_LEFT + ((m - MU_MIN) / (MU_MAX - MU_MIN)) * (SLIDER_RIGHT - SLIDER_LEFT)
const sliderXToMu = (x: number) => {
  const t = (x - SLIDER_LEFT) / (SLIDER_RIGHT - SLIDER_LEFT)
  return MU_MIN + Math.max(0, Math.min(1, t)) * (MU_MAX - MU_MIN)
}
const sigToSliderX = (s: number) =>
  SLIDER_LEFT + ((s - SIG_MIN) / (SIG_MAX - SIG_MIN)) * (SLIDER_RIGHT - SLIDER_LEFT)
const sliderXToSig = (x: number) => {
  const t = (x - SLIDER_LEFT) / (SLIDER_RIGHT - SLIDER_LEFT)
  return SIG_MIN + Math.max(0, Math.min(1, t)) * (SIG_MAX - SIG_MIN)
}

function gaussianPdf(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI))
}

function narrate(mu: number, sigma: number): { text: string; priority: 'normal' | 'high' } {
  if (sigma < 0.6) {
    return {
      text: `Sigma is ${sigma.toFixed(2)} — very narrow. The bell is a tall spike at ${mu.toFixed(1)}. Almost all mass is within a small window of the mean.`,
      priority: 'high',
    }
  }
  if (sigma > 3) {
    return {
      text: `Sigma is ${sigma.toFixed(2)} — very wide. The bell is short and flat: outcomes far from ${mu.toFixed(1)} are common. The 68/95/99 bands span the full axis.`,
      priority: 'high',
    }
  }
  return {
    text: `Bell curve centered at mu equals ${mu.toFixed(1)} with sigma ${sigma.toFixed(2)}. About 68 percent of probability lies within one sigma of the mean — between ${(mu - sigma).toFixed(1)} and ${(mu + sigma).toFixed(1)}.`,
    priority: 'normal',
  }
}

export function Normal() {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const muHandleRef = useRef<SVGGElement | null>(null)
  const sigHandleRef = useRef<SVGGElement | null>(null)
  const [mu, setMu] = useState(0)
  const [sigma, setSigma] = useState(1.5)
  const [isInteracting, setIsInteracting] = useState(false)

  const startMuRef = useRef<number | null>(null)
  const startSigRef = useRef<number | null>(null)

  const updateMu = useCallback((v: number) => setMu(Math.max(MU_MIN, Math.min(MU_MAX, v))), [])
  const updateSig = useCallback((v: number) => setSigma(Math.max(SIG_MIN, Math.min(SIG_MAX, v))), [])

  const bindMu = useDrag(({ first, last, movement: [mx] }) => {
    if (first) startMuRef.current = mu
    const start = startMuRef.current
    if (start === null) return
    setIsInteracting(!last)
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const dxSvg = mx * sx
    const startX = muToSliderX(start)
    const newX = Math.max(SLIDER_LEFT, Math.min(SLIDER_RIGHT, startX + dxSvg))
    updateMu(sliderXToMu(newX))
  })
  const bindSig = useDrag(({ first, last, movement: [mx] }) => {
    if (first) startSigRef.current = sigma
    const start = startSigRef.current
    if (start === null) return
    setIsInteracting(!last)
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const dxSvg = mx * sx
    const startX = sigToSliderX(start)
    const newX = Math.max(SLIDER_LEFT, Math.min(SLIDER_RIGHT, startX + dxSvg))
    updateSig(sliderXToSig(newX))
  })

  useKeyNudge(
    muHandleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const step = Math.abs(dx) >= 10 ? 1 : 0.1
        updateMu(mu + Math.sign(dx) * step)
      },
      [mu, updateMu],
    ),
  )
  useKeyNudge(
    sigHandleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const step = Math.abs(dx) >= 10 ? 0.5 : 0.1
        updateSig(sigma + Math.sign(dx) * step)
      },
      [sigma, updateSig],
    ),
  )

  // The peak of N(0, σ²) is 1/(σ√(2π)). We rescale the curve so the
  // tallest reachable bell (smallest σ in range) fits inside PLOT_H.
  const tallestPeak = gaussianPdf(0, 0, SIG_MIN)
  const peakHere = gaussianPdf(mu, mu, sigma)
  const pdfToPx = (pdf: number) => PLOT_BOTTOM - (pdf / tallestPeak) * PLOT_H * 0.92

  // Build the curve path.
  function curvePath(): string {
    const samples = 320
    const pts: string[] = []
    for (let i = 0; i <= samples; i++) {
      const t = i / samples
      const xWorld = X_MIN + t * (X_MAX - X_MIN)
      const pdf = gaussianPdf(xWorld, mu, sigma)
      pts.push(`${xToPx(xWorld).toFixed(1)},${pdfToPx(pdf).toFixed(1)}`)
    }
    return `M ${pts[0]} L ${pts.slice(1).join(' L ')}`
  }
  // Filled area to a vertical line x = a..b under the curve.
  function bandPath(a: number, b: number): string {
    const samples = 60
    const pts: string[] = []
    for (let i = 0; i <= samples; i++) {
      const t = i / samples
      const xWorld = a + t * (b - a)
      const pdf = gaussianPdf(xWorld, mu, sigma)
      pts.push(`${xToPx(xWorld).toFixed(1)},${pdfToPx(pdf).toFixed(1)}`)
    }
    return `M ${xToPx(a).toFixed(1)},${PLOT_BOTTOM} L ${pts.join(' L ')} L ${xToPx(b).toFixed(1)},${PLOT_BOTTOM} Z`
  }

  // X-axis ticks: integers within [-10, 10] at a sensible stride.
  const tickVals = [-10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10]

  const narration = narrate(mu, sigma)

  // Suppress unused-var lint while keeping peakHere available for debug.
  void peakHere

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
        aria-label={`Normal distribution with mean ${mu.toFixed(2)} and standard deviation ${sigma.toFixed(2)}. The 68, 95, and 99 percent bands are shaded under the curve.`}
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
          The Gaussian — slide μ, stretch σ
        </text>

        {/* X-axis */}
        <line
          x1={PLOT_LEFT}
          y1={PLOT_BOTTOM}
          x2={PLOT_RIGHT}
          y2={PLOT_BOTTOM}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.2"
        />
        {tickVals.map((v) => (
          <g key={v}>
            <line
              x1={xToPx(v)}
              y1={PLOT_BOTTOM}
              x2={xToPx(v)}
              y2={PLOT_BOTTOM + 4}
              stroke="var(--color-graph-ink)"
              strokeWidth="0.7"
            />
            <text
              x={xToPx(v)}
              y={PLOT_BOTTOM + 16}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
            >
              {v}
            </text>
          </g>
        ))}

        {/* 99% band — palest */}
        <path d={bandPath(mu - 3 * sigma, mu + 3 * sigma)} fill="var(--color-vermilion)" fillOpacity="0.07" />
        {/* 95% band — medium */}
        <path d={bandPath(mu - 2 * sigma, mu + 2 * sigma)} fill="var(--color-vermilion)" fillOpacity="0.12" />
        {/* 68% band — darkest */}
        <path d={bandPath(mu - sigma, mu + sigma)} fill="var(--color-vermilion)" fillOpacity="0.22" />

        {/* The curve itself */}
        <path d={curvePath()} fill="none" stroke="var(--color-vermilion)" strokeWidth="1.8" />

        {/* μ marker — vertical dashed line */}
        <line
          x1={xToPx(mu)}
          y1={PLOT_TOP - 4}
          x2={xToPx(mu)}
          y2={PLOT_BOTTOM}
          stroke="var(--color-vermilion-deep)"
          strokeWidth="1.2"
          strokeDasharray="3 3"
          opacity="0.85"
        />
        <text
          x={xToPx(mu)}
          y={PLOT_TOP - 8}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fill="var(--color-vermilion-deep)"
        >
          μ = {mu.toFixed(2)}
        </text>

        {/* σ tick brackets at ±1σ — small caps along the x-axis */}
        {[-1, 1].map((s) => {
          const x = xToPx(mu + s * sigma)
          if (x < PLOT_LEFT || x > PLOT_RIGHT) return null
          return (
            <g key={s}>
              <line
                x1={x}
                y1={PLOT_BOTTOM - 6}
                x2={x}
                y2={PLOT_BOTTOM + 6}
                stroke="var(--color-vermilion)"
                strokeWidth="1.2"
              />
              <text
                x={x}
                y={PLOT_BOTTOM - 12}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="10"
                fill="var(--color-vermilion)"
              >
                {s > 0 ? 'μ+σ' : 'μ−σ'}
              </text>
            </g>
          )
        })}

        {/* Inline legend for the bands */}
        <g transform="translate(36, 70)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            NORMAL · 68 / 95 / 99
          </text>
          <g transform="translate(0, 16)">
            <rect x={0} y={0} width={14} height={8} fill="var(--color-vermilion)" fillOpacity="0.22" />
            <text x={20} y={8} fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-ink)">
              ± 1σ ≈ 68%
            </text>
          </g>
          <g transform="translate(0, 30)">
            <rect x={0} y={0} width={14} height={8} fill="var(--color-vermilion)" fillOpacity="0.12" />
            <text x={20} y={8} fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-ink)">
              ± 2σ ≈ 95%
            </text>
          </g>
          <g transform="translate(0, 44)">
            <rect x={0} y={0} width={14} height={8} fill="var(--color-vermilion)" fillOpacity="0.07" />
            <text x={20} y={8} fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-ink)">
              ± 3σ ≈ 99%
            </text>
          </g>
        </g>

        {/* Density formula — bottom-right corner, italic */}
        <g transform="translate(380, 84)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            DENSITY
          </text>
          <text
            y={22}
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="14"
            fill="var(--color-vermilion)"
          >
            <tspan>f(x) = </tspan>
            <tspan>(1/√(2π) σ)</tspan>
          </text>
          <text
            y={42}
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="14"
            fill="var(--color-vermilion)"
          >
            × exp(−(x−μ)² / 2σ²)
          </text>
        </g>

        {/* μ slider */}
        <g>
          <text
            x={SLIDER_LEFT}
            y={SLIDER_Y_MU - 12}
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            μ — MEAN  ·  {mu.toFixed(2)}
          </text>
          <line
            x1={SLIDER_LEFT}
            y1={SLIDER_Y_MU}
            x2={SLIDER_RIGHT}
            y2={SLIDER_Y_MU}
            stroke="var(--color-graph-ink)"
            strokeWidth="1.2"
          />
          {[-6, -3, 0, 3, 6].map((v) => (
            <g key={v}>
              <line
                x1={muToSliderX(v)}
                y1={SLIDER_Y_MU - 4}
                x2={muToSliderX(v)}
                y2={SLIDER_Y_MU + 4}
                stroke="var(--color-graph-ink)"
                strokeWidth="0.8"
              />
              <text
                x={muToSliderX(v)}
                y={SLIDER_Y_MU + 16}
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
            {...bindMu()}
            ref={muHandleRef}
            tabIndex={0}
            role="slider"
            aria-label={`Mean μ. Currently ${mu.toFixed(2)}. Drag or arrow-key to change.`}
            aria-valuemin={MU_MIN}
            aria-valuemax={MU_MAX}
            aria-valuenow={Number(mu.toFixed(2))}
            style={{ cursor: 'grab', touchAction: 'none' }}
            className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
          >
            <circle cx={muToSliderX(mu)} cy={SLIDER_Y_MU} r="20" fill="transparent" />
            <circle
              cx={muToSliderX(mu)}
              cy={SLIDER_Y_MU}
              r="7"
              fill="var(--color-vermilion)"
              stroke="var(--color-cream)"
              strokeWidth="2"
            />
          </g>
        </g>

        {/* σ slider */}
        <g>
          <text
            x={SLIDER_LEFT}
            y={SLIDER_Y_SIG - 12}
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            σ — STANDARD DEVIATION  ·  {sigma.toFixed(2)}
          </text>
          <line
            x1={SLIDER_LEFT}
            y1={SLIDER_Y_SIG}
            x2={SLIDER_RIGHT}
            y2={SLIDER_Y_SIG}
            stroke="var(--color-graph-ink)"
            strokeWidth="1.2"
          />
          {[0.4, 1, 2, 3, 4].map((v) => (
            <g key={v}>
              <line
                x1={sigToSliderX(v)}
                y1={SLIDER_Y_SIG - 4}
                x2={sigToSliderX(v)}
                y2={SLIDER_Y_SIG + 4}
                stroke="var(--color-graph-ink)"
                strokeWidth="0.8"
              />
              <text
                x={sigToSliderX(v)}
                y={SLIDER_Y_SIG + 16}
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
            {...bindSig()}
            ref={sigHandleRef}
            tabIndex={0}
            role="slider"
            aria-label={`Standard deviation σ. Currently ${sigma.toFixed(2)}. Drag or arrow-key to change.`}
            aria-valuemin={SIG_MIN}
            aria-valuemax={SIG_MAX}
            aria-valuenow={Number(sigma.toFixed(2))}
            style={{ cursor: 'grab', touchAction: 'none' }}
            className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
          >
            <circle cx={sigToSliderX(sigma)} cy={SLIDER_Y_SIG} r="20" fill="transparent" />
            <circle
              cx={sigToSliderX(sigma)}
              cy={SLIDER_Y_SIG}
              r="7"
              fill="var(--color-vermilion)"
              stroke="var(--color-cream)"
              strokeWidth="2"
            />
          </g>
        </g>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3 — Mean centres it, σ widens it
      </figcaption>
    </figure>
  )
}
