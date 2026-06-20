import { useCallback, useEffect, useRef, useState } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * The central limit theorem. The left panel shows the underlying
 * distribution you're sampling from — pick one of four shapes:
 *
 *   uniform · exponential · bimodal · skewed
 *
 * The right panel accumulates the sample-mean histogram: each "draw"
 * pulls 30 samples from the chosen shape, computes the mean, and adds
 * it to the right-panel histogram. A vermilion Gaussian (matched to the
 * theoretical sample-mean variance σ_underlying²/n) is overlaid for the
 * eye to compare. Buttons: draw one · auto-run · reset.
 *
 * The teaching: regardless of the underlying shape, the histogram of
 * sample means tends to a Gaussian. That's the CLT.
 */

const VIEW_W = 600
const VIEW_H = 480
const ORIGIN_X = 300
const ORIGIN_Y = 240
const UNIT = 50

const LEFT_PANEL_X = 30
const LEFT_PANEL_W = 250
const LEFT_PANEL_TOP = 80
const LEFT_PANEL_BOTTOM = 260
const LEFT_PANEL_H = LEFT_PANEL_BOTTOM - LEFT_PANEL_TOP

const RIGHT_PANEL_X = 320
const RIGHT_PANEL_W = 250
const RIGHT_PANEL_TOP = 80
const RIGHT_PANEL_BOTTOM = 260
const RIGHT_PANEL_H = RIGHT_PANEL_BOTTOM - RIGHT_PANEL_TOP

const SAMPLES_PER_DRAW = 30

type ShapeId = 'uniform' | 'exponential' | 'bimodal' | 'skewed'

interface ShapeSpec {
  id: ShapeId
  label: string
  // World-domain min/max for plotting and bin layout.
  xMin: number
  xMax: number
  // True mean and variance — used to position the limit Gaussian.
  trueMean: number
  trueVariance: number
  // Sampling function.
  sample: () => number
  // Density at x (unnormalised silhouette is fine).
  density: (x: number) => number
}

const SHAPES: Record<ShapeId, ShapeSpec> = {
  uniform: {
    id: 'uniform',
    label: 'uniform',
    xMin: 0,
    xMax: 1,
    trueMean: 0.5,
    trueVariance: 1 / 12,
    sample: () => Math.random(),
    density: (x) => (x >= 0 && x <= 1 ? 1 : 0),
  },
  exponential: {
    id: 'exponential',
    label: 'exponential',
    xMin: 0,
    xMax: 5,
    trueMean: 1,
    trueVariance: 1,
    sample: () => -Math.log(1 - Math.random()),
    density: (x) => (x >= 0 ? Math.exp(-x) : 0),
  },
  bimodal: {
    id: 'bimodal',
    label: 'bimodal',
    xMin: 0,
    xMax: 1,
    // Mixture of two narrow Gaussians at 0.2 and 0.8.
    trueMean: 0.5,
    trueVariance: 0.5 * 0.04 + 0.5 * 0.04 + 0.25 * Math.pow(0.2 - 0.8, 2) * 0.5,
    sample: () => {
      // Box–Muller then mix.
      const u1 = Math.max(1e-9, Math.random())
      const u2 = Math.random()
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      const center = Math.random() < 0.5 ? 0.2 : 0.8
      return Math.max(0, Math.min(1, center + 0.05 * z))
    },
    density: (x) => {
      const g1 = Math.exp(-Math.pow((x - 0.2) / 0.05, 2) / 2)
      const g2 = Math.exp(-Math.pow((x - 0.8) / 0.05, 2) / 2)
      return 0.5 * g1 + 0.5 * g2
    },
  },
  skewed: {
    id: 'skewed',
    label: 'skewed',
    xMin: 0,
    xMax: 1,
    trueMean: 1 / 3, // approximate for Beta(1, 2)
    trueVariance: 1 / 18, // Beta(1, 2): α β / ((α+β)² (α+β+1)) = 1*2 / (9 * 4) ≈ 0.0556
    sample: () => {
      // Beta(1, 2) — left-skewed-pdf, right-skewed-tail-toward-0 is fine.
      // Sample two exponentials u1 ~ Gamma(1, 1), u2 ~ Gamma(2, 1).
      const e1 = -Math.log(Math.max(1e-9, Math.random()))
      const e2 = -Math.log(Math.max(1e-9, Math.random())) + (-Math.log(Math.max(1e-9, Math.random())))
      return e1 / (e1 + e2)
    },
    density: (x) => (x >= 0 && x <= 1 ? 2 * (1 - x) : 0),
  },
}

function gaussianPdf(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI))
}

function narrate(shape: ShapeId, drawCount: number, sampleMeans: number[]): { text: string; priority: 'normal' | 'high' } {
  if (drawCount === 0) {
    return {
      text: `Underlying shape: ${SHAPES[shape].label}. Press draw to take ${SAMPLES_PER_DRAW} samples and add their mean to the right-panel histogram. Watch what shape the means form.`,
      priority: 'normal',
    }
  }
  if (drawCount >= 100) {
    const empiricalMean = sampleMeans.reduce((s, v) => s + v, 0) / sampleMeans.length
    return {
      text: `${drawCount} sample means collected from the ${SHAPES[shape].label} distribution. The histogram is bell-shaped, centred near ${empiricalMean.toFixed(3)}. The central limit theorem in action.`,
      priority: 'high',
    }
  }
  return {
    text: `${drawCount} draws so far from the ${SHAPES[shape].label} underlying distribution. The right histogram is the distribution of sample means — keep drawing to see the bell emerge.`,
    priority: 'normal',
  }
}

export function CentralLimitTheorem() {
  const [shape, setShape] = useState<ShapeId>('uniform')
  // Sample means — appended to as draws happen. Stored in a ref to avoid
  // copying long arrays each render; the state count drives re-render.
  const sampleMeansRef = useRef<number[]>([])
  const [drawCount, setDrawCount] = useState(0)
  const [autoRunning, setAutoRunning] = useState(false)

  const spec = SHAPES[shape]

  const drawOne = useCallback(() => {
    let s = 0
    for (let i = 0; i < SAMPLES_PER_DRAW; i++) s += spec.sample()
    sampleMeansRef.current.push(s / SAMPLES_PER_DRAW)
    setDrawCount(sampleMeansRef.current.length)
  }, [spec])

  const reset = useCallback(() => {
    sampleMeansRef.current = []
    setDrawCount(0)
    setAutoRunning(false)
  }, [])

  const changeShape = useCallback((id: ShapeId) => {
    sampleMeansRef.current = []
    setDrawCount(0)
    setAutoRunning(false)
    setShape(id)
  }, [])

  // Auto-run loop: add a batch of draws each frame.
  useEffect(() => {
    if (!autoRunning) return
    let raf = 0
    const step = () => {
      const batch = 5
      for (let i = 0; i < batch; i++) {
        let s = 0
        for (let j = 0; j < SAMPLES_PER_DRAW; j++) s += spec.sample()
        sampleMeansRef.current.push(s / SAMPLES_PER_DRAW)
      }
      setDrawCount(sampleMeansRef.current.length)
      if (sampleMeansRef.current.length >= 500) {
        setAutoRunning(false)
        return
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [autoRunning, spec])

  // Geometry helpers for the two panels.
  const leftXToPx = (x: number) =>
    LEFT_PANEL_X + ((x - spec.xMin) / (spec.xMax - spec.xMin)) * LEFT_PANEL_W

  // Limit Gaussian for the sample-mean histogram.
  const sampleMeanSigma = Math.sqrt(spec.trueVariance / SAMPLES_PER_DRAW)
  const rightXMin = spec.trueMean - 4 * sampleMeanSigma
  const rightXMax = spec.trueMean + 4 * sampleMeanSigma
  const rightXRange = rightXMax - rightXMin
  const rightXToPx = (x: number) =>
    RIGHT_PANEL_X + ((x - rightXMin) / rightXRange) * RIGHT_PANEL_W

  // Sample means as a binned histogram for rendering.
  const N_BINS = 24
  const binWidth = rightXRange / N_BINS
  const bins = new Array(N_BINS).fill(0) as number[]
  const means = sampleMeansRef.current
  for (let i = 0; i < means.length; i++) {
    const m = means[i]
    let idx = Math.floor((m - rightXMin) / binWidth)
    if (idx < 0) idx = 0
    else if (idx >= N_BINS) idx = N_BINS - 1
    bins[idx]++
  }
  const totalCount = Math.max(1, means.length)
  const binDensity = bins.map((c) => c / (totalCount * binWidth))
  // Compare against the limit Gaussian's peak so the eye can read fit.
  const limitPeak = gaussianPdf(spec.trueMean, spec.trueMean, sampleMeanSigma)
  const yScale = Math.max(limitPeak, ...binDensity, 1e-9)

  // Density preview for the left panel — sample at 200 points and rescale.
  const leftDensitySamples = 200
  const leftDensity: number[] = []
  let leftDensityPeak = 1e-9
  for (let i = 0; i <= leftDensitySamples; i++) {
    const t = i / leftDensitySamples
    const x = spec.xMin + t * (spec.xMax - spec.xMin)
    const d = spec.density(x)
    leftDensity.push(d)
    if (d > leftDensityPeak) leftDensityPeak = d
  }
  function leftDensityPath(): string {
    const pts: string[] = []
    for (let i = 0; i <= leftDensitySamples; i++) {
      const t = i / leftDensitySamples
      const x = spec.xMin + t * (spec.xMax - spec.xMin)
      const px = leftXToPx(x)
      const h = (leftDensity[i] / leftDensityPeak) * LEFT_PANEL_H * 0.86
      pts.push(`${px.toFixed(1)},${(LEFT_PANEL_BOTTOM - h).toFixed(1)}`)
    }
    return `M ${pts[0]} L ${pts.slice(1).join(' L ')}`
  }
  function leftDensityFillPath(): string {
    return `${leftDensityPath()} L ${LEFT_PANEL_X + LEFT_PANEL_W},${LEFT_PANEL_BOTTOM} L ${LEFT_PANEL_X},${LEFT_PANEL_BOTTOM} Z`
  }

  function rightLimitPath(): string {
    const samples = 200
    const pts: string[] = []
    for (let i = 0; i <= samples; i++) {
      const t = i / samples
      const x = rightXMin + t * rightXRange
      const pdf = gaussianPdf(x, spec.trueMean, sampleMeanSigma)
      const px = rightXToPx(x)
      const h = (pdf / yScale) * RIGHT_PANEL_H * 0.86
      pts.push(`${px.toFixed(1)},${(RIGHT_PANEL_BOTTOM - h).toFixed(1)}`)
    }
    return `M ${pts[0]} L ${pts.slice(1).join(' L ')}`
  }

  const narration = narrate(shape, drawCount, means)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={narration.text}
        priority={narration.priority}
        isInteracting={autoRunning}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Central limit theorem demonstration. Underlying ${spec.label} distribution on the left. The histogram of ${drawCount} sample-mean draws on the right approaches a Gaussian with mean ${spec.trueMean.toFixed(3)} and standard deviation ${sampleMeanSigma.toFixed(3)}.`}
      >
        <g aria-hidden="true" data-origin-x={ORIGIN_X} data-origin-y={ORIGIN_Y} data-unit={UNIT} />

        <text
          x={VIEW_W / 2}
          y={40}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="15"
          fill="var(--color-ink)"
        >
          Average anything, often enough, and a bell appears
        </text>

        {/* Left panel: the underlying distribution */}
        <g>
          <text
            x={LEFT_PANEL_X}
            y={LEFT_PANEL_TOP - 14}
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            UNDERLYING · {spec.label.toUpperCase()}
          </text>
          {/* Panel frame */}
          <rect
            x={LEFT_PANEL_X}
            y={LEFT_PANEL_TOP}
            width={LEFT_PANEL_W}
            height={LEFT_PANEL_H}
            fill="transparent"
            stroke="var(--color-graph-fade)"
            strokeWidth="0.6"
          />
          {/* Density */}
          <path d={leftDensityFillPath()} fill="var(--color-ink)" fillOpacity="0.18" />
          <path d={leftDensityPath()} fill="none" stroke="var(--color-ink)" strokeWidth="1.4" />
          {/* Mean tick */}
          <line
            x1={leftXToPx(spec.trueMean)}
            y1={LEFT_PANEL_TOP}
            x2={leftXToPx(spec.trueMean)}
            y2={LEFT_PANEL_BOTTOM}
            stroke="var(--color-vermilion)"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.7"
          />
        </g>

        {/* Right panel: the sample-mean histogram + limit curve */}
        <g>
          <text
            x={RIGHT_PANEL_X}
            y={RIGHT_PANEL_TOP - 14}
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            DISTRIBUTION OF SAMPLE MEANS  ·  n={SAMPLES_PER_DRAW}
          </text>
          <rect
            x={RIGHT_PANEL_X}
            y={RIGHT_PANEL_TOP}
            width={RIGHT_PANEL_W}
            height={RIGHT_PANEL_H}
            fill="transparent"
            stroke="var(--color-graph-fade)"
            strokeWidth="0.6"
          />
          {/* Bins */}
          {binDensity.map((d, i) => {
            const h = (d / yScale) * RIGHT_PANEL_H * 0.86
            const x = RIGHT_PANEL_X + (i / N_BINS) * RIGHT_PANEL_W
            const w = RIGHT_PANEL_W / N_BINS - 1
            return (
              <rect
                key={i}
                x={x}
                y={RIGHT_PANEL_BOTTOM - h}
                width={w}
                height={h}
                fill="var(--color-ink)"
                fillOpacity="0.55"
                stroke="var(--color-graph-ink)"
                strokeWidth="0.3"
              />
            )
          })}
          {/* Limit Gaussian — always drawn so the target is visible */}
          <path d={rightLimitPath()} fill="none" stroke="var(--color-vermilion)" strokeWidth="1.8" />
          {/* True-mean tick */}
          <line
            x1={rightXToPx(spec.trueMean)}
            y1={RIGHT_PANEL_TOP}
            x2={rightXToPx(spec.trueMean)}
            y2={RIGHT_PANEL_BOTTOM}
            stroke="var(--color-vermilion)"
            strokeWidth="1"
            strokeDasharray="3 3"
            opacity="0.7"
          />
        </g>

        {/* Arrow between panels: "average n of these" */}
        <g>
          <line
            x1={LEFT_PANEL_X + LEFT_PANEL_W + 8}
            y1={(LEFT_PANEL_TOP + LEFT_PANEL_BOTTOM) / 2}
            x2={RIGHT_PANEL_X - 8}
            y2={(RIGHT_PANEL_TOP + RIGHT_PANEL_BOTTOM) / 2}
            stroke="var(--color-vermilion)"
            strokeWidth="1.2"
          />
          <polygon
            points={`${RIGHT_PANEL_X - 8},${(RIGHT_PANEL_TOP + RIGHT_PANEL_BOTTOM) / 2} ${RIGHT_PANEL_X - 14},${(RIGHT_PANEL_TOP + RIGHT_PANEL_BOTTOM) / 2 - 4} ${RIGHT_PANEL_X - 14},${(RIGHT_PANEL_TOP + RIGHT_PANEL_BOTTOM) / 2 + 4}`}
            fill="var(--color-vermilion)"
          />
          <text
            x={(LEFT_PANEL_X + LEFT_PANEL_W + RIGHT_PANEL_X) / 2}
            y={(LEFT_PANEL_TOP + LEFT_PANEL_BOTTOM) / 2 - 8}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="9"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            avg n=30
          </text>
        </g>

        {/* Shape picker — four small buttons */}
        <g transform={`translate(30, 290)`}>
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            UNDERLYING SHAPE
          </text>
          {(Object.values(SHAPES) as ShapeSpec[]).map((s, i) => (
            <ShapeButton
              key={s.id}
              x={i * 84}
              y={14}
              label={s.label}
              active={s.id === shape}
              onClick={() => changeShape(s.id)}
            />
          ))}
        </g>

        {/* Action buttons — draw / auto-run / reset */}
        <g transform="translate(30, 366)">
          <text
            fontFamily="Inter, sans-serif"
            fontSize="10"
            letterSpacing="0.18em"
            fill="var(--color-dim)"
          >
            ACTIONS
          </text>
          <ActionButton x={0} y={14} label="Draw" onClick={drawOne} />
          <ActionButton
            x={88}
            y={14}
            label={autoRunning ? 'Pause' : 'Auto-run'}
            primary
            onClick={() => setAutoRunning((v) => !v)}
          />
          <ActionButton x={196} y={14} label="Reset" onClick={reset} />
        </g>

        {/* Readout */}
        <g transform="translate(360, 290)">
          <text fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.18em" fill="var(--color-dim)">
            DRAWS — {drawCount}
          </text>
          <text y={20} fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-ink)">
            true μ = {spec.trueMean.toFixed(3)}
          </text>
          <text y={38} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-vermilion)">
            σ̄ = √(σ²/n) ≈ {sampleMeanSigma.toFixed(3)}
          </text>
        </g>

        {/* Help text */}
        <text
          x={30}
          y={VIEW_H - 14}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          PICK A SHAPE · DRAW · WATCH THE BELL EMERGE FROM ANY UNDERLYING
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5 — The central limit theorem: averages are always bell-shaped
      </figcaption>
    </figure>
  )
}

function ShapeButton({
  x,
  y,
  label,
  active,
  onClick,
}: {
  x: number
  y: number
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-pressed={active}
      aria-label={`Underlying shape: ${label}`}
      style={{ cursor: 'pointer' }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="focus-visible:outline-none [&:focus-visible_rect]:stroke-vermilion-deep"
    >
      <rect
        x={0}
        y={0}
        width={78}
        height={24}
        rx={3}
        fill={active ? 'var(--color-vermilion)' : 'transparent'}
        stroke={active ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
        strokeWidth="1.2"
      />
      <text
        x={39}
        y={16}
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
        fontSize="11"
        letterSpacing="0.06em"
        fill={active ? 'var(--color-cream)' : 'var(--color-ink)'}
      >
        {label}
      </text>
    </g>
  )
}

function ActionButton({
  x,
  y,
  label,
  primary = false,
  onClick,
}: {
  x: number
  y: number
  label: string
  primary?: boolean
  onClick: () => void
}) {
  const W = primary ? 100 : 80
  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={label}
      style={{ cursor: 'pointer' }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="focus-visible:outline-none [&:focus-visible_rect]:stroke-vermilion-deep"
    >
      <rect
        x={0}
        y={0}
        width={W}
        height={28}
        rx={3}
        fill={primary ? 'var(--color-vermilion)' : 'transparent'}
        stroke={primary ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
        strokeWidth="1.2"
      />
      <text
        x={W / 2}
        y={18}
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
        fontSize="11"
        letterSpacing="0.12em"
        fill={primary ? 'var(--color-cream)' : 'var(--color-ink)'}
      >
        {label.toUpperCase()}
      </text>
    </g>
  )
}
