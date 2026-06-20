import { useCallback, useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import { PixelImage } from './PixelGrid'
import { alphaBarAt, alphaBarCurve, betaAt, noisyImageAt, T_STEPS } from './image'

/**
 * Act 2 — Forward noise.
 *
 *  Left  : the clean arrow image at step t; as t grows, Gaussian noise is
 *          added per pixel. Slider for t lives on the left below the image.
 *  Right : the noise schedule curve — alpha_bar_t (the cumulative product
 *          of (1 - beta_s)), with the current t marked. Below it, beta_t.
 *
 * Co-mutating so the slider on the left also moves the marker on the right.
 */

const VIEW_W = 600
const VIEW_H = 480

export interface ForwardState {
  t: number
}

export const INITIAL_FORWARD: ForwardState = { t: 200 }

const SLIDER_Y = VIEW_H - 56
const SLIDER_X_MIN = 60
const SLIDER_X_MAX = VIEW_W - 60
const T_MIN = 0
const T_MAX = T_STEPS

const tToX = (t: number) =>
  SLIDER_X_MIN + ((t - T_MIN) / (T_MAX - T_MIN)) * (SLIDER_X_MAX - SLIDER_X_MIN)
const xToT = (x: number) =>
  T_MIN + ((x - SLIDER_X_MIN) / (SLIDER_X_MAX - SLIDER_X_MIN)) * (T_MAX - T_MIN)

function narrate(t: number): { text: string; priority: 'normal' | 'high' } {
  const aBar = alphaBarAt(t)
  const signal = Math.sqrt(aBar)
  if (t === 0) {
    return {
      text: 'Step zero. The image is clean — no noise has been added yet.',
      priority: 'high',
    }
  }
  if (t >= T_MAX) {
    return {
      text: 'Step one thousand. The image is indistinguishable from pure Gaussian noise. All structure is gone.',
      priority: 'high',
    }
  }
  if (signal < 0.05) {
    return {
      text: `Step ${t}. Almost pure noise — the signal share is below five percent.`,
      priority: 'normal',
    }
  }
  return {
    text: `Step ${t}. The image is ${(signal * 100).toFixed(0)} percent original and ${((1 - signal) * 100).toFixed(0)} percent Gaussian noise.`,
    priority: 'normal',
  }
}

export function LeftPane({
  state,
  onChange,
}: {
  state: ForwardState
  onChange: (s: ForwardState) => void
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const startRef = useRef<number | null>(null)

  const t = state.t
  const setT = useCallback(
    (next: number) => {
      const clamped = Math.max(T_MIN, Math.min(T_MAX, Math.round(next)))
      onChange({ t: clamped })
    },
    [onChange],
  )

  const bind = useDrag(({ first, movement: [mx] }) => {
    if (first) startRef.current = t
    const start = startRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const dxSvg = mx * sx
    const startX = tToX(start)
    const newX = Math.max(SLIDER_X_MIN, Math.min(SLIDER_X_MAX, startX + dxSvg))
    setT(xToT(newX))
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        if (dx === 0) return
        const small = 20
        const large = 100
        const isShift = Math.abs(dx) >= 10
        setT(t + (isShift ? Math.sign(dx) * large : Math.sign(dx) * small))
      },
      [t, setT],
    ),
  )

  const pixels = noisyImageAt(t)
  const narration = narrate(t)
  const handleX = tToX(t)

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration.text} priority={narration.priority} />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Forward diffusion at step ${t} out of ${T_MAX}. The arrow image is being blended with Gaussian noise.`}
      >
        <text
          x={VIEW_W / 2}
          y="46"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          x_t &middot; FORWARD DIFFUSION
        </text>

        <PixelImage pixels={pixels} cx={VIEW_W / 2} cy={220} cell={17} />

        <text
          x={VIEW_W / 2}
          y={360}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="14"
          fill="var(--color-ink)"
        >
          t = {t}
        </text>

        {/* Slider rail */}
        <line
          x1={SLIDER_X_MIN}
          y1={SLIDER_Y}
          x2={SLIDER_X_MAX}
          y2={SLIDER_Y}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.2"
        />
        {[0, 250, 500, 750, 1000].map((v) => (
          <g key={v}>
            <line
              x1={tToX(v)}
              y1={SLIDER_Y - 6}
              x2={tToX(v)}
              y2={SLIDER_Y + 6}
              stroke="var(--color-graph-ink)"
              strokeWidth="1"
            />
            <text
              x={tToX(v)}
              y={SLIDER_Y + 22}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="11"
              fill="var(--color-dim)"
            >
              {v}
            </text>
          </g>
        ))}
        <g
          {...bind()}
          ref={handleRef}
          tabIndex={0}
          role="slider"
          aria-label={`Diffusion step t. Current value ${t}. Arrow keys to nudge by twenty, Shift plus arrow to step by one hundred.`}
          aria-valuemin={T_MIN}
          aria-valuemax={T_MAX}
          aria-valuenow={t}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_circle:last-of-type]:stroke-vermilion-deep"
        >
          <circle cx={handleX} cy={SLIDER_Y} r="22" fill="transparent" />
          <circle
            cx={handleX}
            cy={SLIDER_Y}
            r="8"
            fill="var(--color-vermilion)"
            stroke="var(--color-cream)"
            strokeWidth="2"
          />
        </g>
        <text
          x={SLIDER_X_MIN}
          y={SLIDER_Y - 18}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          DRAG &middot; ARROWS NUDGE &middot; STEP t
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1a &mdash; A clean image, slowly drowning in Gaussian noise
      </figcaption>
    </figure>
  )
}

export function RightPane({ state }: { state: ForwardState }) {
  const t = state.t
  const curve = alphaBarCurve(81)
  const PLOT_X0 = 80
  const PLOT_X1 = VIEW_W - 60
  const PLOT_Y0_SIG = 96
  const PLOT_Y1_SIG = 248
  const PLOT_Y0_BETA = 296
  const PLOT_Y1_BETA = 396

  const tToPx = (tt: number) =>
    PLOT_X0 + (tt / T_STEPS) * (PLOT_X1 - PLOT_X0)
  const yToPxSig = (v: number) =>
    PLOT_Y1_SIG - v * (PLOT_Y1_SIG - PLOT_Y0_SIG)
  const yToPxBeta = (v: number) => {
    // beta_t goes from 1e-4 to 2e-2; normalize for plot
    const normalized = v / 0.02
    return PLOT_Y1_BETA - normalized * (PLOT_Y1_BETA - PLOT_Y0_BETA)
  }

  const sigPath = curve
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${tToPx(p.t).toFixed(2)} ${yToPxSig(Math.sqrt(p.alphaBar)).toFixed(2)}`)
    .join(' ')
  const noisePath = curve
    .map(
      (p, i) =>
        `${i === 0 ? 'M' : 'L'} ${tToPx(p.t).toFixed(2)} ${yToPxSig(Math.sqrt(1 - p.alphaBar)).toFixed(2)}`,
    )
    .join(' ')
  const betaPath = curve
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${tToPx(p.t).toFixed(2)} ${yToPxBeta(p.beta).toFixed(2)}`)
    .join(' ')

  const aBar = alphaBarAt(t)
  const signal = Math.sqrt(aBar)
  const beta = betaAt(t)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`At step ${t}, the signal share is ${signal.toFixed(2)} and the noise share is ${(Math.sqrt(1 - aBar)).toFixed(2)}. The per-step variance beta-t is ${beta.toExponential(2)}.`}
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Noise schedule plot. Signal share decays from one to zero as t grows. At t equals ${t}, signal is ${signal.toFixed(2)}.`}
      >
        <text
          x={VIEW_W / 2}
          y="46"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THE NOISE SCHEDULE
        </text>

        {/* Top plot — signal & noise shares */}
        <text
          x={PLOT_X0}
          y={PLOT_Y0_SIG - 12}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          SIGNAL &amp; NOISE SHARES
        </text>
        {/* Axes */}
        <line x1={PLOT_X0} y1={PLOT_Y1_SIG} x2={PLOT_X1} y2={PLOT_Y1_SIG} stroke="var(--color-graph-ink)" strokeWidth="1" />
        <line x1={PLOT_X0} y1={PLOT_Y0_SIG} x2={PLOT_X0} y2={PLOT_Y1_SIG} stroke="var(--color-graph-ink)" strokeWidth="1" />
        {/* Tick labels */}
        <text x={PLOT_X0 - 6} y={yToPxSig(0) + 4} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-dim)">
          0
        </text>
        <text x={PLOT_X0 - 6} y={yToPxSig(1) + 4} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-dim)">
          1
        </text>

        <path d={sigPath} fill="none" stroke="var(--color-vermilion)" strokeWidth="2" />
        <path d={noisePath} fill="none" stroke="var(--color-graph-fade)" strokeWidth="1.5" strokeDasharray="3 3" />

        {/* Curve labels */}
        <text
          x={PLOT_X1 - 6}
          y={yToPxSig(0.05)}
          textAnchor="end"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="11"
          fill="var(--color-vermilion)"
        >
          &radic;&alpha;&#772;_t (signal)
        </text>
        <text
          x={PLOT_X1 - 6}
          y={yToPxSig(0.95)}
          textAnchor="end"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="11"
          fill="var(--color-dim)"
        >
          &radic;(1 &minus; &alpha;&#772;_t) (noise)
        </text>

        {/* Current-t marker */}
        <line
          x1={tToPx(t)}
          y1={PLOT_Y0_SIG}
          x2={tToPx(t)}
          y2={PLOT_Y1_SIG}
          stroke="var(--color-vermilion)"
          strokeWidth="1"
          strokeDasharray="2 3"
          opacity="0.6"
        />
        <circle cx={tToPx(t)} cy={yToPxSig(signal)} r="4" fill="var(--color-vermilion)" />

        {/* Bottom plot — beta_t */}
        <text
          x={PLOT_X0}
          y={PLOT_Y0_BETA - 12}
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          &beta;_t (PER-STEP VARIANCE)
        </text>
        <line x1={PLOT_X0} y1={PLOT_Y1_BETA} x2={PLOT_X1} y2={PLOT_Y1_BETA} stroke="var(--color-graph-ink)" strokeWidth="1" />
        <line x1={PLOT_X0} y1={PLOT_Y0_BETA} x2={PLOT_X0} y2={PLOT_Y1_BETA} stroke="var(--color-graph-ink)" strokeWidth="1" />
        <path d={betaPath} fill="none" stroke="var(--color-ink)" strokeWidth="2" />
        <text x={PLOT_X0 - 6} y={yToPxBeta(0) + 4} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-dim)">
          0
        </text>
        <text x={PLOT_X0 - 6} y={yToPxBeta(0.02) + 4} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-dim)">
          0.02
        </text>
        <line
          x1={tToPx(t)}
          y1={PLOT_Y0_BETA}
          x2={tToPx(t)}
          y2={PLOT_Y1_BETA}
          stroke="var(--color-vermilion)"
          strokeWidth="1"
          strokeDasharray="2 3"
          opacity="0.6"
        />
        <circle cx={tToPx(t)} cy={yToPxBeta(beta)} r="3.5" fill="var(--color-vermilion)" />

        {/* Bottom math */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 30}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          x_t = &radic;(1&minus;&beta;) &middot; x_(t&minus;1) + &radic;&beta; &middot; noise
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1b &mdash; A schedule for slowly letting the signal go
      </figcaption>
    </figure>
  )
}
