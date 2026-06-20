import { useCallback, useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import {
  VIEW_W,
  VIEW_H,
  kaplanLoss,
  chinchillaTokens,
  PARAMS_LOG_MIN,
  PARAMS_LOG_MAX,
  fmtParams,
  fmtTokens,
  fmt2,
} from './lm'

/**
 * Act 3 — Kaplan scaling laws. left-drives-right.
 *
 *  Left  : log-log plot of loss vs model parameters N. A draggable slider
 *          along the x-axis. Famous models annotated (GPT-2, GPT-3, etc).
 *  Right : readouts — loss at this N; recommended training tokens (Chinchilla
 *          20× N); a small "compute order-of-magnitude" line.
 *
 * left-drives-right: the right pane re-derives entirely from logN.
 */

export interface ScalingState {
  /** log10 of model parameter count, clamped to [PARAMS_LOG_MIN, PARAMS_LOG_MAX]. */
  logN: number
  interacting: boolean
}

export const INITIAL_SCALING: ScalingState = { logN: 11, interacting: false }

export function deriveScalingRight(left: ScalingState): ScalingState {
  return { ...left }
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

/* ============================================================== */
/* LEFT PANE — log-log Kaplan plot                                  */
/* ============================================================== */

const CHART_LEFT = 78
const CHART_RIGHT = VIEW_W - 36
const CHART_TOP = 90
const CHART_BOTTOM = VIEW_H - 100

// Loss y-range (log scale).
const LOSS_LOG_MIN = -0.5 // 10^-0.5 ≈ 0.32
const LOSS_LOG_MAX = 0.5 // 10^0.5  ≈ 3.16

const logNtoX = (logN: number) =>
  CHART_LEFT +
  ((logN - PARAMS_LOG_MIN) / (PARAMS_LOG_MAX - PARAMS_LOG_MIN)) *
    (CHART_RIGHT - CHART_LEFT)
const XtoLogN = (x: number) =>
  PARAMS_LOG_MIN +
  ((x - CHART_LEFT) / (CHART_RIGHT - CHART_LEFT)) * (PARAMS_LOG_MAX - PARAMS_LOG_MIN)

const lossToY = (l: number) => {
  const logL = Math.log10(Math.max(1e-3, l))
  return (
    CHART_BOTTOM -
    ((logL - LOSS_LOG_MIN) / (LOSS_LOG_MAX - LOSS_LOG_MIN)) * (CHART_BOTTOM - CHART_TOP)
  )
}

const KAPLAN_PATH = (() => {
  const pts: string[] = []
  const N = 60
  for (let i = 0; i <= N; i++) {
    const logN = PARAMS_LOG_MIN + (i / N) * (PARAMS_LOG_MAX - PARAMS_LOG_MIN)
    const Np = Math.pow(10, logN)
    const l = kaplanLoss(Np)
    pts.push(`${i === 0 ? 'M' : 'L'}${logNtoX(logN).toFixed(2)},${lossToY(l).toFixed(2)}`)
  }
  return pts.join(' ')
})()

const REFERENCE_MODELS = [
  { logN: Math.log10(1.5e9), label: 'GPT-2' },
  { logN: Math.log10(175e9), label: 'GPT-3' },
  { logN: Math.log10(70e9), label: 'Chinchilla' },
  { logN: Math.log10(1e12), label: 'GPT-4' },
]

export function LeftPane({
  state,
  onChange,
}: {
  state: ScalingState
  onChange: (s: ScalingState) => void
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const handleRef = useRef<SVGGElement | null>(null)
  const startRef = useRef<number | null>(null)

  const set = useCallback(
    (logN: number, interacting: boolean) =>
      onChange({
        logN: clamp(logN, PARAMS_LOG_MIN, PARAMS_LOG_MAX),
        interacting,
      }),
    [onChange],
  )

  const bind = useDrag(({ first, last, movement: [mx] }) => {
    if (first) startRef.current = state.logN
    const start = startRef.current
    if (start === null) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const sx = VIEW_W / rect.width
    const dx = mx * sx
    const newX = logNtoX(start) + dx
    set(XtoLogN(newX), !last)
  })

  useKeyNudge(
    handleRef,
    useCallback(
      (dx: number) => {
        set(state.logN + dx * 0.1, false)
      },
      [state.logN, set],
    ),
  )

  const N = Math.pow(10, state.logN)
  const loss = kaplanLoss(N)
  const handleX = logNtoX(state.logN)
  const handleY = lossToY(loss)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`The Kaplan scaling-laws plot. At ${fmtParams(N)} parameters, the predicted loss is ${fmt2(loss).trim()} bits per token. Drag the slider along the x-axis to change the model size.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Log-log plot of loss vs model parameters. Current size: ${fmtParams(N)}. Loss: ${fmt2(loss).trim()} bits.`}
      >
        <text
          x={VIEW_W / 2}
          y="30"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          KAPLAN · 2020 · LOG-LOG LOSS vs PARAMETERS
        </text>

        {/* Axes */}
        <line
          x1={CHART_LEFT}
          y1={CHART_TOP}
          x2={CHART_LEFT}
          y2={CHART_BOTTOM}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
        />
        <line
          x1={CHART_LEFT}
          y1={CHART_BOTTOM}
          x2={CHART_RIGHT}
          y2={CHART_BOTTOM}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
        />

        {/* x ticks */}
        {[6, 8, 10, 12].map((lt) => (
          <g key={lt}>
            <line
              x1={logNtoX(lt)}
              y1={CHART_BOTTOM}
              x2={logNtoX(lt)}
              y2={CHART_BOTTOM + 5}
              stroke="var(--color-graph-ink)"
              strokeWidth="0.8"
            />
            <text
              x={logNtoX(lt)}
              y={CHART_BOTTOM + 20}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
            >
              {fmtParams(Math.pow(10, lt))}
            </text>
          </g>
        ))}
        <text
          x={(CHART_LEFT + CHART_RIGHT) / 2}
          y={CHART_BOTTOM + 38}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          model parameters N (log)
        </text>

        {/* y ticks */}
        {[-0.5, 0, 0.5].map((ll) => {
          const v = Math.pow(10, ll)
          return (
            <g key={ll}>
              <line
                x1={CHART_LEFT - 5}
                y1={lossToY(v)}
                x2={CHART_LEFT}
                y2={lossToY(v)}
                stroke="var(--color-graph-ink)"
                strokeWidth="0.8"
              />
              <text
                x={CHART_LEFT - 10}
                y={lossToY(v) + 4}
                textAnchor="end"
                fontFamily="JetBrains Mono, monospace"
                fontSize="10"
                fill="var(--color-dim)"
              >
                {v.toFixed(2)}
              </text>
            </g>
          )
        })}
        <text
          x={CHART_LEFT - 56}
          y={(CHART_TOP + CHART_BOTTOM) / 2}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
          transform={`rotate(-90 ${CHART_LEFT - 56} ${(CHART_TOP + CHART_BOTTOM) / 2})`}
        >
          loss (log)
        </text>

        {/* Reference dots */}
        {REFERENCE_MODELS.map((m) => {
          const x = logNtoX(m.logN)
          const y = lossToY(kaplanLoss(Math.pow(10, m.logN)))
          return (
            <g key={m.label}>
              <circle cx={x} cy={y} r="2.5" fill="var(--color-graph-ink)" />
              <text
                x={x + 6}
                y={y - 4}
                fontFamily="JetBrains Mono, monospace"
                fontSize="9"
                fill="var(--color-dim)"
              >
                {m.label}
              </text>
            </g>
          )
        })}

        {/* The curve */}
        <path
          d={KAPLAN_PATH}
          fill="none"
          stroke="var(--color-graph-ink)"
          strokeWidth="1.6"
        />

        {/* Vertical guide */}
        <line
          x1={handleX}
          y1={CHART_TOP}
          x2={handleX}
          y2={CHART_BOTTOM}
          stroke="var(--color-vermilion)"
          strokeWidth="0.8"
          strokeDasharray="3 3"
          opacity="0.6"
        />

        {/* Handle */}
        <g
          {...bind()}
          ref={handleRef}
          tabIndex={0}
          role="slider"
          aria-label="Model parameter slider"
          aria-valuemin={PARAMS_LOG_MIN}
          aria-valuemax={PARAMS_LOG_MAX}
          aria-valuenow={state.logN}
          aria-valuetext={`${fmtParams(N)} parameters, predicted loss ${fmt2(loss).trim()} bits`}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_.knob]:stroke-vermilion-deep"
        >
          <circle cx={handleX} cy={handleY} r="22" fill="transparent" />
          <circle
            className="knob"
            cx={handleX}
            cy={handleY}
            r="8"
            fill="var(--color-vermilion)"
            stroke="var(--color-cream)"
            strokeWidth="2"
          />
        </g>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 30}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          loss is a power law in N
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3a &mdash; A straight line on log-log paper
      </figcaption>
    </figure>
  )
}

/* ============================================================== */
/* RIGHT PANE — readout panel                                       */
/* ============================================================== */

export function RightPane({ state }: { state: ScalingState }) {
  const N = Math.pow(10, state.logN)
  const loss = kaplanLoss(N)
  const tokens = chinchillaTokens(N)

  // Stylised compute estimate: FLOPs ≈ 6 · N · tokens (the Kaplan accounting).
  const flops = 6 * N * tokens

  const fmtFlops = (f: number) => {
    if (f >= 1e24) return `${(f / 1e24).toFixed(1)} yottaFLOPs`
    if (f >= 1e21) return `${(f / 1e21).toFixed(1)} zettaFLOPs`
    if (f >= 1e18) return `${(f / 1e18).toFixed(1)} exaFLOPs`
    if (f >= 1e15) return `${(f / 1e15).toFixed(1)} petaFLOPs`
    return f.toExponential(1) + ' FLOPs'
  }

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`At ${fmtParams(N)} parameters, the predicted loss is ${fmt2(loss).trim()} bits per token. Chinchilla’s rule says compute-optimal training uses about ${fmtTokens(tokens)}.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Readouts for a ${fmtParams(N)} parameter model: loss ${fmt2(loss).trim()}, ${fmtTokens(tokens)}.`}
      >
        <rect
          x="40"
          y="40"
          width={VIEW_W - 80}
          height={VIEW_H - 80}
          fill="none"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        <text
          x={VIEW_W / 2}
          y="76"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          AT THIS SCALE
        </text>

        {/* Parameter count */}
        <text
          x={VIEW_W / 2}
          y="130"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="12"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          N
        </text>
        <text
          x={VIEW_W / 2}
          y="162"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="34"
          fontWeight="600"
          fill="var(--color-vermilion)"
        >
          {fmtParams(N)}
        </text>
        <text
          x={VIEW_W / 2}
          y="184"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          parameters
        </text>

        {/* Divider */}
        <line
          x1={VIEW_W / 2 - 60}
          y1="216"
          x2={VIEW_W / 2 + 60}
          y2="216"
          stroke="var(--color-vermilion)"
          strokeWidth="0.6"
        />

        {/* Loss */}
        <text
          x="100"
          y="252"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          PREDICTED LOSS
        </text>
        <text
          x="100"
          y="274"
          fontFamily="JetBrains Mono, monospace"
          fontSize="14"
          fill="var(--color-ink)"
        >
          L(N) = (N_c / N)^α ≈ {fmt2(loss).trim()}
        </text>

        {/* Chinchilla tokens */}
        <text
          x="100"
          y="316"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          letterSpacing="0.18em"
          fill="var(--color-vermilion)"
        >
          CHINCHILLA · 20 TOKENS PER PARAM
        </text>
        <text
          x="100"
          y="338"
          fontFamily="JetBrains Mono, monospace"
          fontSize="14"
          fill="var(--color-ink)"
        >
          {fmtTokens(tokens)}
        </text>

        {/* Compute */}
        <text
          x="100"
          y="378"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          letterSpacing="0.18em"
          fill="var(--color-dim)"
        >
          COMPUTE (≈ 6 · N · D)
        </text>
        <text
          x="100"
          y="400"
          fontFamily="JetBrains Mono, monospace"
          fontSize="14"
          fill="var(--color-ink)"
        >
          {fmtFlops(flops)}
        </text>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 30}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          model · data · compute — choose two, the third is forced
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 3b &mdash; Hoffmann et al., DeepMind, March 2022
      </figcaption>
    </figure>
  )
}
