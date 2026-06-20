import { useMemo } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import {
  VIEW_W,
  VIEW_H,
  XOR_DATA,
  xorBatchStep,
  randomParams,
  forward,
  reseed,
  fmt2,
  type MlpParams,
} from './mlp'

/**
 * Act 8 — representation learning.
 *
 *  Left  : three small heatmaps side by side, one per hidden neuron, each
 *          showing the activation of that neuron over (x1, x2) ∈ [-0.5,
 *          1.5]². On top is overlaid the four XOR examples (vermilion =
 *          positive, ink = negative). The shapes the hidden neurons settle
 *          into are *features* — half-planes the network learned to use.
 *  Right : the (h1, h2, h3) "hidden space" — projected to (h1, h2) for
 *          drawability — showing where the four examples land after the
 *          hidden layer transforms them. In hidden space the four points
 *          are linearly separable, even though they aren't in input space.
 *          A faint line marks the output neuron's boundary in (h1, h2).
 *
 * The MLP is trained once on mount to convergence using the same dynamics
 * as Act 7, then displayed statically. (We avoid re-training every render.)
 */

// Train an MLP to a low XOR loss; return the resulting params.
function trainToConvergence(seed: number): MlpParams {
  reseed(seed)
  let p = randomParams(2.0)
  // 2500 batch updates is enough for clean XOR convergence at η = 1.6.
  for (let i = 0; i < 2500; i++) {
    p = xorBatchStep(p, 1.6).params
  }
  return p
}

// Sample a heatmap of a scalar function over the input plane.
const HM_GRID = 18
const D_MIN = -0.5
const D_MAX = 1.5
function sampleHeatmap(f: (x1: number, x2: number) => number) {
  const cells: { x: number; y: number; v: number }[] = []
  for (let i = 0; i < HM_GRID; i++) {
    for (let j = 0; j < HM_GRID; j++) {
      const x = D_MIN + ((i + 0.5) / HM_GRID) * (D_MAX - D_MIN)
      const y = D_MIN + ((j + 0.5) / HM_GRID) * (D_MAX - D_MIN)
      cells.push({ x, y, v: f(x, y) })
    }
  }
  return cells
}

const HEAT_W = 156
const HEAT_H = 156
const HEAT_GAP = 16
const HEAT_Y = 130

function heatRect(rowY: number, hmCells: ReturnType<typeof sampleHeatmap>, offsetX: number) {
  return hmCells.map((c, idx) => {
    const colIdx = Math.floor(((c.x - D_MIN) / (D_MAX - D_MIN)) * HM_GRID)
    const rowIdx = Math.floor(((c.y - D_MIN) / (D_MAX - D_MIN)) * HM_GRID)
    return (
      <rect
        key={idx}
        x={offsetX + (colIdx / HM_GRID) * HEAT_W}
        y={rowY + HEAT_H - ((rowIdx + 1) / HM_GRID) * HEAT_H}
        width={HEAT_W / HM_GRID}
        height={HEAT_H / HM_GRID}
        fill="var(--color-vermilion)"
        opacity={0.08 + 0.78 * c.v}
      />
    )
  })
}

const dataToHeatX = (x: number, offsetX: number) =>
  offsetX + ((x - D_MIN) / (D_MAX - D_MIN)) * HEAT_W
const dataToHeatY = (y: number, rowY: number) =>
  rowY + HEAT_H - ((y - D_MIN) / (D_MAX - D_MIN)) * HEAT_H

/* ============================================================== */
/* LEFT PANE — three hidden-neuron heatmaps                         */
/* ============================================================== */

export function LeftPane() {
  const P = useMemo(() => trainToConvergence(0xa1b2c3), [])

  // Heatmaps per hidden neuron: probe h_i over the input plane.
  const heatmaps = useMemo(() => {
    return [0, 1, 2].map((i) =>
      sampleHeatmap((x1, x2) => forward(P, [x1, x2]).h[i]),
    )
  }, [P])

  // Centre three heatmaps horizontally inside the frame.
  const total = 3 * HEAT_W + 2 * HEAT_GAP
  const startX = (VIEW_W - total) / 2

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="Three heatmaps, one per hidden neuron, after training an MLP on XOR to convergence. Each map shows the activation of that hidden unit over the input plane. The neurons have settled into different features: each carves a roughly half-plane shape in input space. The output combines these three features to produce a non-linear classifier."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Three heatmaps showing what each hidden neuron has learned to detect in the input plane after training."
      >
        <rect x="40" y="40" width={VIEW_W - 80} height={VIEW_H - 80} fill="none" stroke="var(--color-graph-fade)" strokeWidth="1" />
        <text x={VIEW_W / 2} y="78" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="11" letterSpacing="0.22em" fill="var(--color-dim)">
          THE HIDDEN NEURONS · WHAT THEY LEARNED
        </text>

        {[0, 1, 2].map((i) => {
          const offsetX = startX + i * (HEAT_W + HEAT_GAP)
          return (
            <g key={i}>
              {/* Heatmap */}
              {heatRect(HEAT_Y, heatmaps[i], offsetX)}
              {/* Border */}
              <rect x={offsetX} y={HEAT_Y} width={HEAT_W} height={HEAT_H} fill="none" stroke="var(--color-graph-fade)" strokeWidth="1" />
              {/* XOR example dots */}
              {XOR_DATA.map((ex, k) => (
                <circle
                  key={k}
                  cx={dataToHeatX(ex.x[0], offsetX)}
                  cy={dataToHeatY(ex.x[1], HEAT_Y)}
                  r="5"
                  fill={ex.t === 1 ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
                  stroke="var(--color-cream)"
                  strokeWidth="1.6"
                />
              ))}
              {/* Label */}
              <text x={offsetX + HEAT_W / 2} y={HEAT_Y + HEAT_H + 22} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-vermilion)">
                h{i + 1}
              </text>
              <text x={offsetX + HEAT_W / 2} y={HEAT_Y + HEAT_H + 40} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="var(--color-dim)">
                activation
              </text>
            </g>
          )
        })}

        <text x={VIEW_W / 2} y={VIEW_H - 56} textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-dim)">
          three half-planes &mdash; chosen by the network itself
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 7a &mdash; Each hidden neuron is a learned feature
      </figcaption>
    </figure>
  )
}

/* ============================================================== */
/* RIGHT PANE — hidden space                                       */
/* ============================================================== */

export function RightPane() {
  const P = useMemo(() => trainToConvergence(0xa1b2c3), [])

  // For each XOR example compute the hidden vector and project onto (h1, h2).
  const projected = XOR_DATA.map((ex) => {
    const f = forward(P, ex.x)
    return { h: f.h, t: ex.t, x: ex.x }
  })

  // Plot rect in (h1, h2)
  const HX0 = 110
  const HX1 = VIEW_W - 110
  const HY0 = 130
  const HY1 = 380
  const HW = HX1 - HX0
  const HH = HY1 - HY0
  const hToX = (h: number) => HX0 + h * HW
  const hToY = (h: number) => HY1 - h * HH

  // Background — sample a coarse grid in (h1, h2) and ask the output neuron's
  // partial decision: how does the output respond when ONLY h1, h2 vary and
  // h3 is fixed at the mean over the 4 examples?
  const h3Mean = projected.reduce((s, p) => s + p.h[2], 0) / projected.length

  const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))
  const yAt = (h1: number, h2: number) =>
    sigmoid(P.V[0] * h1 + P.V[1] * h2 + P.V[2] * h3Mean + P.c)

  const GRID = 14
  const cells: React.ReactNode[] = []
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const h1 = (i + 0.5) / GRID
      const h2 = (j + 0.5) / GRID
      const yv = yAt(h1, h2)
      const intensity = Math.abs(yv - 0.5) * 2
      const fill = yv > 0.5 ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'
      cells.push(
        <rect
          key={`${i}-${j}`}
          x={HX0 + (i / GRID) * HW}
          y={HY1 - ((j + 1) / GRID) * HH}
          width={HW / GRID}
          height={HH / GRID}
          fill={fill}
          opacity={0.05 + 0.18 * intensity}
        />,
      )
    }
  }

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="The same four XOR examples, plotted in the hidden representation (h1, h2). In input space the four points were arranged in an X — no straight line could separate them. In hidden space the network has folded them so that the positive examples and the negative examples sit on opposite sides of a single straight cut. That cut is the output neuron's boundary."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="The four XOR examples plotted in hidden space (h1, h2). They are linearly separable here even though they were not in input space."
      >
        <rect x="40" y="40" width={VIEW_W - 80} height={VIEW_H - 80} fill="none" stroke="var(--color-graph-fade)" strokeWidth="1" />
        <text x={VIEW_W / 2} y="78" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="11" letterSpacing="0.22em" fill="var(--color-dim)">
          HIDDEN SPACE · (h₁, h₂) · LINEARLY SEPARABLE
        </text>

        {/* Frame */}
        <rect x={HX0} y={HY0} width={HW} height={HH} fill="var(--color-cream)" stroke="var(--color-graph-fade)" strokeWidth="1" />
        {/* Background coloured cells */}
        {cells}

        {/* Axes ticks */}
        {[0, 0.5, 1].map((v) => (
          <g key={`xt-${v}`}>
            <line x1={hToX(v)} y1={HY1} x2={hToX(v)} y2={HY1 + 4} stroke="var(--color-graph-ink)" strokeWidth="1" />
            <text x={hToX(v)} y={HY1 + 18} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="var(--color-dim)">
              {v}
            </text>
          </g>
        ))}
        {[0, 0.5, 1].map((v) => (
          <g key={`yt-${v}`}>
            <line x1={HX0 - 4} y1={hToY(v)} x2={HX0} y2={hToY(v)} stroke="var(--color-graph-ink)" strokeWidth="1" />
            <text x={HX0 - 8} y={hToY(v) + 4} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="var(--color-dim)">
              {v}
            </text>
          </g>
        ))}
        <text x={HX1} y={HY1 + 18} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-dim)">
          h₁
        </text>
        <text x={HX0 - 10} y={HY0 + 4} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-dim)">
          h₂
        </text>

        {/* Projected example points */}
        {projected.map((p, i) => {
          const cx = hToX(p.h[0])
          const cy = hToY(p.h[1])
          const color = p.t === 1 ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r="10" fill={color} stroke="var(--color-cream)" strokeWidth="2" />
              <text x={cx + 14} y={cy + 4} fontFamily="JetBrains Mono, monospace" fontSize="9" fill="var(--color-dim)">
                ({p.x[0]},{p.x[1]})
              </text>
              <text x={cx + 14} y={cy + 18} fontFamily="JetBrains Mono, monospace" fontSize="9" fill={color}>
                ({fmt2(p.h[0]).trim()}, {fmt2(p.h[1]).trim()})
              </text>
            </g>
          )
        })}

        <text x={VIEW_W / 2} y={VIEW_H - 56} textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-dim)">
          the hidden layer folded the plane until a line could cut it
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 7b &mdash; Representation is the whole game
      </figcaption>
    </figure>
  )
}
