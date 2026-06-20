import { useCallback, useEffect, useRef } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import {
  VIEW_W,
  VIEW_H,
  XOR_DATA,
  xorBatchStep,
  xorLoss,
  randomParams,
  predict,
  reseed,
  fmt2,
  type MlpParams,
} from './mlp'

/**
 * Act 7 — putting it together. Train an MLP on XOR. Forward → loss →
 * backward → SGD step → repeat. The boundary that the perceptron couldn't
 * find appears here in real time.
 *
 *  Left  : the (x1, x2) plane, [-0.5, 1.5] × [-0.5, 1.5]. The four XOR
 *          examples are scattered as dots — vermilion for class 1
 *          (positive), ink for class 0. The decision surface (where the
 *          MLP's output crosses 0.5) is drawn as a polygon obtained by
 *          sampling the network on a 24×24 grid. As training progresses,
 *          the surface deforms from straight to curved to clearly
 *          XOR-separating.
 *  Right : a loss curve in (epoch, L) space. Below, a small panel with the
 *          current network outputs y on each of the four XOR examples —
 *          training driving each toward its target.
 *
 * Co-mutating state.
 */

export interface TrainState {
  params: MlpParams
  epoch: number
  loss: number
  history: { epoch: number; loss: number }[]
  playing: boolean
  /** A reroll counter — bumps to reset the params deterministically. */
  runId: number
}

function initialise(runId: number): TrainState {
  reseed(0xc0ffee ^ runId)
  const params = randomParams(2.0)
  return {
    params,
    epoch: 0,
    loss: xorLoss(params),
    history: [{ epoch: 0, loss: xorLoss(params) }],
    playing: false,
    runId,
  }
}

export const INITIAL_TRAIN: TrainState = initialise(0)

const LEARN_RATE = 1.6
const TICK_MS = 16
const STEPS_PER_TICK = 6
const MAX_EPOCH = 4000

function trainStep(s: TrainState): TrainState {
  let p = s.params
  let loss = s.loss
  for (let k = 0; k < STEPS_PER_TICK; k++) {
    const r = xorBatchStep(p, LEARN_RATE)
    p = r.params
    loss = r.loss
  }
  const epoch = s.epoch + STEPS_PER_TICK
  const next: TrainState = {
    ...s,
    params: p,
    epoch,
    loss,
    history:
      s.history.length > 200
        ? [...s.history.slice(-100), { epoch, loss }]
        : [...s.history, { epoch, loss }],
  }
  if (epoch >= MAX_EPOCH) next.playing = false
  return next
}

/* ============================================================== */
/* LEFT PANE — feature space with decision surface                 */
/* ============================================================== */

// Plot rectangle inside the SVG.
const PX0 = 90
const PX1 = VIEW_W - 90
const PY0 = 110
const PY1 = 380
const PW = PX1 - PX0
const PH = PY1 - PY0
const D_MIN = -0.5
const D_MAX = 1.5
const dToX = (d: number) => PX0 + ((d - D_MIN) / (D_MAX - D_MIN)) * PW
const dToY = (d: number) => PY1 - ((d - D_MIN) / (D_MAX - D_MIN)) * PH

export function LeftPane({
  state,
  onChange,
}: {
  state: TrainState
  onChange: (s: TrainState) => void
}) {
  const ref = useRef(state)
  useEffect(() => {
    ref.current = state
  }, [state])

  useEffect(() => {
    if (!state.playing) return
    const id = window.setInterval(() => {
      onChange(trainStep(ref.current))
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [state.playing, onChange])

  const handlePlay = useCallback(() => onChange({ ...state, playing: !state.playing }), [state, onChange])
  const handleReset = useCallback(() => onChange(initialise(state.runId + 1)), [state.runId, onChange])
  const handleStep = useCallback(() => onChange(trainStep(state)), [state, onChange])

  // Build a coloured grid of the decision surface.
  const GRID = 18
  const cells = []
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const cx = D_MIN + ((i + 0.5) / GRID) * (D_MAX - D_MIN)
      const cy = D_MIN + ((j + 0.5) / GRID) * (D_MAX - D_MIN)
      const yhat = predict(state.params, cx, cy)
      const intensity = Math.abs(yhat - 0.5) * 2
      const fill = yhat > 0.5 ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'
      const opacity = 0.05 + 0.18 * intensity
      cells.push(
        <rect
          key={`${i}-${j}`}
          x={PX0 + (i / GRID) * PW}
          y={PY1 - ((j + 1) / GRID) * PH}
          width={PW / GRID}
          height={PH / GRID}
          fill={fill}
          opacity={opacity}
        />,
      )
    }
  }

  const converged = state.loss < 0.02
  const narration = converged
    ? `Converged. After ${state.epoch} epochs the loss is ${state.loss.toFixed(3)} — the MLP has solved XOR. The boundary curves through the data, separating the diagonal pairs the perceptron couldn't.`
    : state.playing
      ? `Training. Epoch ${state.epoch}, loss ${state.loss.toFixed(3)}. The decision surface is deforming.`
      : `Stopped at epoch ${state.epoch}, loss ${state.loss.toFixed(3)}. Press play to keep training.`

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration} priority={converged ? 'high' : 'normal'} />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Decision surface of an MLP trained on XOR, epoch ${state.epoch}, loss ${state.loss.toFixed(3)}.`}
      >
        <rect x="40" y="40" width={VIEW_W - 80} height={VIEW_H - 80} fill="none" stroke="var(--color-graph-fade)" strokeWidth="1" />
        <text x={VIEW_W / 2} y="78" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="11" letterSpacing="0.22em" fill="var(--color-dim)">
          XOR · EPOCH {state.epoch} · LOSS {state.loss.toFixed(3)}
        </text>

        {/* Plot frame */}
        <rect x={PX0} y={PY0} width={PW} height={PH} fill="var(--color-cream)" stroke="var(--color-graph-fade)" strokeWidth="1" />
        {/* Coloured surface */}
        {cells}

        {/* Axis ticks */}
        {[0, 1].map((v) => (
          <g key={`xt-${v}`}>
            <line x1={dToX(v)} y1={PY1} x2={dToX(v)} y2={PY1 + 4} stroke="var(--color-graph-ink)" strokeWidth="1" />
            <text x={dToX(v)} y={PY1 + 18} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-dim)">
              {v}
            </text>
          </g>
        ))}
        {[0, 1].map((v) => (
          <g key={`yt-${v}`}>
            <line x1={PX0 - 4} y1={dToY(v)} x2={PX0} y2={dToY(v)} stroke="var(--color-graph-ink)" strokeWidth="1" />
            <text x={PX0 - 8} y={dToY(v) + 4} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-dim)">
              {v}
            </text>
          </g>
        ))}

        {/* XOR examples */}
        {XOR_DATA.map((ex, i) => {
          const cx = dToX(ex.x[0])
          const cy = dToY(ex.x[1])
          const color = ex.t === 1 ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r="10" fill={color} stroke="var(--color-cream)" strokeWidth="2" />
            </g>
          )
        })}

        {/* Controls */}
        <Button x={PX0} y={PY1 + 40} width={60} label={state.playing ? 'pause' : 'play'} primary onClick={handlePlay} ariaLabel={state.playing ? 'Pause training.' : 'Start training.'} />
        <Button x={PX0 + 72} y={PY1 + 40} width={56} label="step" onClick={handleStep} ariaLabel="Apply one training step." />
        <Button x={PX0 + 138} y={PY1 + 40} width={60} label="reset" onClick={handleReset} ariaLabel="Reinitialise weights with a new random seed." />
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6a &mdash; The boundary the perceptron couldn&rsquo;t find
      </figcaption>
    </figure>
  )
}

function Button({
  x,
  y,
  width,
  label,
  primary,
  onClick,
  ariaLabel,
}: {
  x: number
  y: number
  width: number
  label: string
  primary?: boolean
  onClick: () => void
  ariaLabel: string
}) {
  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={ariaLabel}
      style={{ cursor: 'pointer' }}
      className="focus-visible:outline-none [&:focus-visible_rect]:stroke-vermilion-deep"
    >
      <rect width={width} height="28" fill={primary ? 'var(--color-vermilion)' : 'transparent'} stroke="var(--color-vermilion)" strokeWidth="1.2" />
      <text x={width / 2} y="18" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="12" fill={primary ? 'var(--color-cream)' : 'var(--color-vermilion)'}>
        {label}
      </text>
    </g>
  )
}

/* ============================================================== */
/* RIGHT PANE — loss curve and live predictions                    */
/* ============================================================== */

export function RightPane({ state }: { state: TrainState; onChange: (s: TrainState) => void }) {
  // Loss curve plot
  const RX0 = 90
  const RX1 = VIEW_W - 90
  const RY0 = 110
  const RY1 = 260
  const RW = RX1 - RX0
  const RH = RY1 - RY0

  const maxL = Math.max(...state.history.map((h) => h.loss), 0.5)
  const maxEpoch = Math.max(...state.history.map((h) => h.epoch), 1)

  const eToX = (e: number) => RX0 + (e / maxEpoch) * RW
  const lToY = (l: number) => RY1 - (l / maxL) * RH

  const lossPath = state.history
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${eToX(p.epoch).toFixed(2)} ${lToY(p.loss).toFixed(2)}`)
    .join(' ')

  // Live per-example predictions
  const preds = XOR_DATA.map((ex) => ({
    x: ex.x,
    t: ex.t,
    y: predict(state.params, ex.x[0], ex.x[1]),
  }))

  return (
    <figure className="w-full">
      <CanvasNarrative
        text={`Loss curve over training, and the network's current output on each of the four XOR examples. The four numbers drift toward their targets as training proceeds.`}
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Loss curve over epoch and the network's current prediction on each of the four XOR examples.`}
      >
        <rect x="40" y="40" width={VIEW_W - 80} height={VIEW_H - 80} fill="none" stroke="var(--color-graph-fade)" strokeWidth="1" />
        <text x={VIEW_W / 2} y="78" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="11" letterSpacing="0.22em" fill="var(--color-dim)">
          LOSS · PER-EXAMPLE PREDICTIONS
        </text>

        {/* Loss plot frame */}
        <rect x={RX0} y={RY0} width={RW} height={RH} fill="none" stroke="var(--color-graph-fade)" strokeWidth="1" />
        <line x1={RX0} y1={RY1} x2={RX1} y2={RY1} stroke="var(--color-graph-ink)" strokeWidth="1" />
        <line x1={RX0} y1={RY0} x2={RX0} y2={RY1} stroke="var(--color-graph-ink)" strokeWidth="1" />
        <text x={RX1} y={RY1 + 16} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-dim)">
          epoch
        </text>
        <text x={RX0 - 6} y={RY0 + 4} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-dim)">
          L
        </text>

        <path d={lossPath} stroke="var(--color-vermilion)" strokeWidth="2" fill="none" />

        {/* Predictions table */}
        <text x={RX0} y={RY1 + 50} fontFamily="Inter, sans-serif" fontSize="9" letterSpacing="0.22em" fill="var(--color-dim)">
          PER-EXAMPLE OUTPUTS
        </text>
        {preds.map((p, i) => {
          const rowY = RY1 + 76 + i * 22
          const err = p.y - p.t
          return (
            <g key={i}>
              <text x={RX0} y={rowY} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-ink)">
                ({p.x[0]}, {p.x[1]}) → target {p.t}
              </text>
              <text x={RX0 + 220} y={rowY} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-vermilion)">
                y = {fmt2(p.y).trim()}
              </text>
              <text x={RX0 + 320} y={rowY} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-dim)">
                err = {fmt2(err).trim()}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6b &mdash; The AI winter ends, on screen
      </figcaption>
    </figure>
  )
}
