import { useCallback, useRef } from 'react'
import { useDrag } from '@use-gesture/react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import {
  VIEW_W,
  VIEW_H,
  EMERGENCE_CURVES,
  emergenceAccuracy,
  capabilityAtScale,
  fmtParams,
  PARAMS_LOG_MIN,
  PARAMS_LOG_MAX,
} from './lm'

/**
 * Act 4 — emergence. left-drives-right.
 *
 *  Left  : a multi-curve plot. Six task families (completion, basic QA,
 *          instructions, arithmetic, chain-of-thought, agentic). Each curve
 *          is a sigmoid that turns on at a different scale. A vertical
 *          "scale" slider drags across the x-axis.
 *  Right : a "what the model can do at this scale" panel — the list of six
 *          capabilities lit/dim based on whether the curve has turned on.
 *
 * left-drives-right.
 */

export interface EmergenceState {
  /** log10 of model parameter count. */
  logN: number
  interacting: boolean
}

export const INITIAL_EMERGENCE: EmergenceState = { logN: 9.0, interacting: false }

export function deriveEmergenceRight(left: EmergenceState): EmergenceState {
  return { ...left }
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

/* ============================================================== */
/* LEFT PANE — emergence plot                                       */
/* ============================================================== */

const CHART_LEFT = 78
const CHART_RIGHT = VIEW_W - 36
const CHART_TOP = 80
const CHART_BOTTOM = VIEW_H - 100

const logNtoX = (logN: number) =>
  CHART_LEFT +
  ((logN - PARAMS_LOG_MIN) / (PARAMS_LOG_MAX - PARAMS_LOG_MIN)) *
    (CHART_RIGHT - CHART_LEFT)
const XtoLogN = (x: number) =>
  PARAMS_LOG_MIN +
  ((x - CHART_LEFT) / (CHART_RIGHT - CHART_LEFT)) * (PARAMS_LOG_MAX - PARAMS_LOG_MIN)
const accToY = (a: number) => CHART_BOTTOM - a * (CHART_BOTTOM - CHART_TOP)

const CURVE_PATHS = EMERGENCE_CURVES.map((c, idx) => {
  const pts: string[] = []
  const N = 80
  for (let i = 0; i <= N; i++) {
    const logN = PARAMS_LOG_MIN + (i / N) * (PARAMS_LOG_MAX - PARAMS_LOG_MIN)
    const a = emergenceAccuracy(c, logN)
    pts.push(`${i === 0 ? 'M' : 'L'}${logNtoX(logN).toFixed(2)},${accToY(a).toFixed(2)}`)
  }
  return { id: c.id, label: c.label, idx, d: pts.join(' ') }
})

// Distinct curve colors — vermilion for the most striking transition.
const CURVE_COLORS = [
  'var(--color-graph-ink)',
  'var(--color-graph-ink)',
  'var(--color-graph-ink)',
  'var(--color-vermilion)',
  'var(--color-vermilion)',
  'var(--color-vermilion-deep, var(--color-vermilion))',
]
const CURVE_OPACITY = [0.45, 0.55, 0.7, 1.0, 1.0, 1.0]

export function LeftPane({
  state,
  onChange,
}: {
  state: EmergenceState
  onChange: (s: EmergenceState) => void
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
      (dx: number) => set(state.logN + dx * 0.1, false),
      [state.logN, set],
    ),
  )

  const handleX = logNtoX(state.logN)
  const N = Math.pow(10, state.logN)

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`At ${fmtParams(N)} parameters. ${capabilityAtScale(state.logN)} The capability curves are sigmoids that turn on at different scales — flat for a long time, then suddenly rising.`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Six task-accuracy curves vs model scale. Scale: ${fmtParams(N)}.`}
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
          ACCURACY · SIX TASKS · vs MODEL SCALE
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
        {[0, 0.5, 1.0].map((a) => (
          <g key={a}>
            <line
              x1={CHART_LEFT - 5}
              y1={accToY(a)}
              x2={CHART_LEFT}
              y2={accToY(a)}
              stroke="var(--color-graph-ink)"
              strokeWidth="0.8"
            />
            <text
              x={CHART_LEFT - 10}
              y={accToY(a) + 4}
              textAnchor="end"
              fontFamily="JetBrains Mono, monospace"
              fontSize="10"
              fill="var(--color-dim)"
            >
              {a.toFixed(1)}
            </text>
          </g>
        ))}

        {/* Curves */}
        {CURVE_PATHS.map((cp) => (
          <path
            key={cp.id}
            d={cp.d}
            fill="none"
            stroke={CURVE_COLORS[cp.idx]}
            strokeWidth="1.6"
            strokeOpacity={CURVE_OPACITY[cp.idx]}
          />
        ))}

        {/* Vertical slider line */}
        <line
          x1={handleX}
          y1={CHART_TOP}
          x2={handleX}
          y2={CHART_BOTTOM}
          stroke="var(--color-vermilion)"
          strokeWidth="1.2"
        />

        {/* Slider handle on baseline */}
        <g
          {...bind()}
          ref={handleRef}
          tabIndex={0}
          role="slider"
          aria-label="Model scale slider"
          aria-valuemin={PARAMS_LOG_MIN}
          aria-valuemax={PARAMS_LOG_MAX}
          aria-valuenow={state.logN}
          aria-valuetext={`${fmtParams(N)} parameters`}
          style={{ cursor: 'grab', touchAction: 'none' }}
          className="focus-visible:outline-none [&:focus-visible_.knob]:stroke-vermilion-deep"
        >
          <rect
            x={handleX - 20}
            y={CHART_BOTTOM - 14}
            width="40"
            height="28"
            fill="transparent"
          />
          <polygon
            className="knob"
            points={`${handleX - 8},${CHART_BOTTOM + 2} ${handleX + 8},${CHART_BOTTOM + 2} ${handleX},${CHART_BOTTOM - 8}`}
            fill="var(--color-vermilion)"
            stroke="var(--color-cream)"
            strokeWidth="1.6"
          />
        </g>

        <text
          x={handleX}
          y={CHART_TOP - 6}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fill="var(--color-vermilion)"
        >
          {fmtParams(N)}
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
          flat, flat, flat — then a switch flips
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4a &mdash; Drag the scale; watch the curves wake up
      </figcaption>
    </figure>
  )
}

/* ============================================================== */
/* RIGHT PANE — capability panel                                    */
/* ============================================================== */

const SCALE_TIERS = [
  { logN: 8, label: '100M parameters', tag: 'small LM' },
  { logN: 9, label: '1B parameters', tag: 'GPT-1 era' },
  { logN: 10, label: '10B parameters', tag: 'mid-2020s open-source' },
  { logN: 11.24, label: '175B parameters', tag: 'GPT-3' },
  { logN: 12, label: '1T parameters', tag: 'GPT-4 class' },
]

const CAPABILITY_AT_TIER: Record<number, string[]> = {
  8: ['Coherent completion', 'Rambles on instructions'],
  9: ['Basic Q & A', 'Single-step facts'],
  10: ['Instruction following', 'Light coding'],
  11: ['Chain-of-thought', 'Multi-step arithmetic'],
  12: ['Sustained tool use', 'Agentic planning'],
}

export function RightPane({ state }: { state: EmergenceState }) {
  const N = Math.pow(10, state.logN)

  // The closest tier strictly ≤ state.logN.
  const tierIdx = SCALE_TIERS.reduce(
    (acc, t, i) => (t.logN <= state.logN + 0.4 ? i : acc),
    0,
  )

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`What the model can do at ${fmtParams(N)} parameters. ${capabilityAtScale(state.logN)}`}
        priority="normal"
        isInteracting={state.interacting}
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Capability tiers at ${fmtParams(N)} parameters.`}
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
          y="74"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          WHAT IT CAN DO AT THIS SCALE
        </text>

        {SCALE_TIERS.map((t, i) => {
          const active = i <= tierIdx
          const y = 116 + i * 64
          return (
            <g key={t.logN}>
              <line
                x1="80"
                y1={y - 22}
                x2={VIEW_W - 80}
                y2={y - 22}
                stroke="var(--color-graph-fade)"
                strokeWidth="0.6"
              />
              <text
                x="80"
                y={y - 4}
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                letterSpacing="0.16em"
                fill={active ? 'var(--color-vermilion)' : 'var(--color-fade)'}
              >
                {t.label.toUpperCase()}
              </text>
              <text
                x={VIEW_W - 80}
                y={y - 4}
                textAnchor="end"
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="11"
                fill={active ? 'var(--color-dim)' : 'var(--color-fade)'}
              >
                {t.tag}
              </text>
              {CAPABILITY_AT_TIER[t.logN]?.map((cap, j) => (
                <text
                  key={j}
                  x="100"
                  y={y + 18 + j * 18}
                  fontFamily="Source Serif 4, Georgia, serif"
                  fontSize="14"
                  fontWeight={active ? 600 : 400}
                  fill={active ? 'var(--color-ink)' : 'var(--color-fade)'}
                >
                  · {cap}
                </text>
              ))}
            </g>
          )
        })}

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 30}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          new behaviours appear without being asked for
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4b &mdash; A staircase, not a ramp
      </figcaption>
    </figure>
  )
}
