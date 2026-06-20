import { useCallback } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import {
  VIEW_W,
  VIEW_H,
  ILLUSTRATIVE_PARAMS,
  forward,
  backward,
  fmt2,
  fmt3,
} from './mlp'

/**
 * Act 6 — why reverse matters. The same network from Act 3, but with a step
 * button that advances a backward "wavefront" from right (loss) to left
 * (input). At each step a different set of arrows light up vermilion to
 * show which gradients have just been computed, and the right pane shows
 * the running cost:
 *
 *  - Forward-mode would cost ONE forward pass per parameter (here: 13).
 *  - Reverse-mode costs ONE backward pass for ALL gradients.
 *
 * The numbers are live: the actual gradients computed for the same
 * (x1=0.6, x2=-0.4, t=0) example. The reader can advance step-by-step or
 * reset.
 *
 * Co-mutating state — both panes share the same `step` count (0..4).
 */

const P = ILLUSTRATIVE_PARAMS
const X = [0.6, -0.4] as [number, number]
const T = 0
const F = forward(P, X)
const G = backward(P, F, T)

export interface ReverseState {
  /** 0 = nothing computed; 1 = ∂L/∂y; 2 = + ∂L/∂z_o, ∂L/∂V, ∂L/∂c;
   *  3 = + ∂L/∂h, ∂L/∂z_h; 4 = + ∂L/∂W, ∂L/∂b (everything). */
  step: number
}

export const INITIAL_REVERSE: ReverseState = { step: 0 }
const N_STEPS = 4

// Network geometry — match HiddenLayers.
const IN_X = 110
const HID_X = 300
const OUT_X = 490
const IN_Y = [200, 320]
const HID_Y = [150, 250, 350]
const OUT_Y = 250

/* ============================================================== */
/* LEFT PANE — diagram with backward wavefront                     */
/* ============================================================== */

export function LeftPane({
  state,
  onChange,
}: {
  state: ReverseState
  onChange: (s: ReverseState) => void
}) {
  const handleStep = useCallback(
    () => onChange({ step: Math.min(N_STEPS, state.step + 1) }),
    [state.step, onChange],
  )
  const handleReset = useCallback(() => onChange({ step: 0 }), [onChange])

  // Which edges are "lit" at this step (i.e. their gradient has been pushed
  // across). Step 1 lights nothing yet (we just have ∂L/∂y at the output);
  // step 2 lights V edges (hidden → output, computed and applied); step 3
  // lights nothing new structurally (∂L/∂h is on the hidden nodes); step 4
  // lights W edges (input → hidden).
  const litVEdges = state.step >= 2
  const litWEdges = state.step >= 4

  // Narration: a moving headline that depends on step.
  const narration =
    state.step === 0
      ? `Reverse-mode autodiff. We're about to compute the gradient of the loss with respect to every weight in the network. Press step to begin at the output and walk backward.`
      : state.step === 1
        ? `Step 1. We start at the loss. The gradient with respect to the output y is y minus t, which equals ${fmt2(G.dy).trim()}. That's the seed.`
        : state.step === 2
          ? `Step 2. Push through the output neuron's sigmoid and into the V weights. Three gradients computed: dV1 equals ${fmt3(G.dV[0]).trim()}, dV2 equals ${fmt3(G.dV[1]).trim()}, dV3 equals ${fmt3(G.dV[2]).trim()}, and dc equals ${fmt3(G.dc).trim()}.`
          : state.step === 3
            ? `Step 3. Push backward across V into the hidden activations. Each hidden neuron now has a gradient on its activation — the share of blame it deserves for the loss.`
            : `Step 4. Push through each hidden sigmoid and into the W weights. Six gradients on W and three on b. The entire network's gradient is computed in one backward pass.`

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration} priority="normal" />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Reverse-mode autodiff walk-through, step ${state.step} of ${N_STEPS}.`}
      >
        <rect x="40" y="40" width={VIEW_W - 80} height={VIEW_H - 80} fill="none" stroke="var(--color-graph-fade)" strokeWidth="1" />
        <text x={VIEW_W / 2} y="78" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="11" letterSpacing="0.22em" fill="var(--color-dim)">
          REVERSE-MODE AUTODIFF · STEP {state.step} OF {N_STEPS}
        </text>

        {/* Edges input → hidden (lit at step 4) */}
        {IN_Y.map((y1, i) =>
          HID_Y.map((y2, j) => (
            <line
              key={`ih-${i}-${j}`}
              x1={IN_X + 20}
              y1={y1}
              x2={HID_X - 20}
              y2={y2}
              stroke={litWEdges ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
              strokeWidth={litWEdges ? 2 : 1.1}
              strokeOpacity={litWEdges ? 0.95 : 0.45}
              markerEnd={litWEdges ? 'url(#bp-arrow-rev)' : undefined}
            />
          )),
        )}
        {/* Edges hidden → output (lit at step 2) */}
        {HID_Y.map((y, i) => (
          <line
            key={`ho-${i}`}
            x1={HID_X + 22}
            y1={y}
            x2={OUT_X - 22}
            y2={OUT_Y}
            stroke={litVEdges ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
            strokeWidth={litVEdges ? 2 : 1.2}
            strokeOpacity={litVEdges ? 0.95 : 0.55}
            markerEnd={litVEdges ? 'url(#bp-arrow-rev)' : undefined}
          />
        ))}

        {/* Reverse-direction arrowhead marker */}
        <defs>
          <marker id="bp-arrow-rev" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-vermilion)" />
          </marker>
        </defs>

        {/* Input nodes */}
        {IN_Y.map((y, i) => (
          <Node key={`in-${i}`} x={IN_X} y={y} label={`x${i + 1}`} />
        ))}
        {/* Hidden nodes — show ∂L/∂h once step >= 3 */}
        {HID_Y.map((y, i) => (
          <Node
            key={`h-${i}`}
            x={HID_X}
            y={y}
            label={`h${i + 1}`}
            grad={state.step >= 3 ? fmt2(G.dh[i]) : null}
            accent
          />
        ))}
        {/* Output node — gradient ∂L/∂y visible once step >= 1 */}
        <Node x={OUT_X} y={OUT_Y} label="y" grad={state.step >= 1 ? fmt2(G.dy) : null} output />

        {/* Loss bubble */}
        <g>
          <line x1={OUT_X + 22} y1={OUT_Y} x2={OUT_X + 58} y2={OUT_Y} stroke="var(--color-graph-ink)" strokeWidth="1.4" />
          <circle cx={OUT_X + 80} cy={OUT_Y} r="22" fill="var(--color-cream)" stroke="var(--color-ink)" strokeWidth="1.4" />
          <text x={OUT_X + 80} y={OUT_Y + 4} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-ink)">
            L
          </text>
        </g>

        {/* Controls */}
        <Button x={120} y={VIEW_H - 88} width={70} label="step" primary onClick={handleStep} ariaLabel={`Advance backward pass to step ${Math.min(N_STEPS, state.step + 1)} of ${N_STEPS}.`} />
        <Button x={200} y={VIEW_H - 88} width={66} label="reset" onClick={handleReset} ariaLabel="Reset backward pass to the start." />

        <text x={VIEW_W - 60} y={VIEW_H - 64} textAnchor="end" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          RIGHT &rarr; LEFT
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5a &mdash; The gradient flows backward
      </figcaption>
    </figure>
  )
}

function Node({
  x,
  y,
  label,
  grad,
  accent,
  output,
}: {
  x: number
  y: number
  label: string
  grad?: string | null
  accent?: boolean
  output?: boolean
}) {
  const stroke = accent || output ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'
  return (
    <g>
      <circle cx={x} cy={y} r={output ? 22 : 18} fill="var(--color-cream)" stroke={stroke} strokeWidth={output ? 2 : 1.4} />
      <text x={x} y={y + 4} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="12" fill={accent || output ? 'var(--color-vermilion)' : 'var(--color-ink)'}>
        {label}
      </text>
      {grad !== null && grad !== undefined && (
        <text x={x} y={y + 38} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-vermilion)">
          ∂L = {grad.trim()}
        </text>
      )}
    </g>
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
/* RIGHT PANE — cost comparison                                    */
/* ============================================================== */

export function RightPane({ state }: { state: ReverseState; onChange: (s: ReverseState) => void }) {
  // The network has: W (6) + b (3) + V (3) + c (1) = 13 trainable params.
  const N_PARAMS = 13

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="Why backward? The loss is one number; the network has thirteen parameters. Forward-mode would need one forward pass per parameter — thirteen forward passes for thirteen gradients. Reverse-mode does it in a single backward pass — all thirteen gradients at once. For a real network with billions of parameters, the difference is the difference between possible and impossible."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A cost comparison between forward-mode and reverse-mode automatic differentiation. Forward costs one pass per parameter; reverse costs one pass for all parameters."
      >
        <rect x="40" y="40" width={VIEW_W - 80} height={VIEW_H - 80} fill="none" stroke="var(--color-graph-fade)" strokeWidth="1" />
        <text x={VIEW_W / 2} y="78" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="11" letterSpacing="0.22em" fill="var(--color-dim)">
          THE LINEAR-ALGEBRA TRICK
        </text>

        {/* Forward mode row */}
        <text x={80} y={130} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          FORWARD MODE
        </text>
        <text x={80} y={158} fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-ink)">
          one forward pass &middot; per parameter
        </text>
        {/* Tally of passes */}
        <g transform={`translate(80, 180)`}>
          {Array.from({ length: N_PARAMS }, (_, i) => (
            <rect key={i} x={i * 22} y={0} width="16" height="22" fill="none" stroke="var(--color-graph-ink)" strokeWidth="1" />
          ))}
        </g>
        <text x={80} y={224} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-ink)">
          {N_PARAMS} passes &middot; {N_PARAMS} gradients
        </text>

        {/* Reverse mode row */}
        <text x={80} y={272} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-vermilion)">
          REVERSE MODE
        </text>
        <text x={80} y={300} fontFamily="JetBrains Mono, monospace" fontSize="12" fill="var(--color-vermilion)">
          one backward pass &middot; total
        </text>
        <g transform={`translate(80, 322)`}>
          <rect x={0} y={0} width={Math.max(16, N_PARAMS * 22 * (state.step / N_STEPS))} height="22" fill="var(--color-vermilion)" opacity="0.85" />
          <rect x={0} y={0} width={N_PARAMS * 22} height="22" fill="none" stroke="var(--color-vermilion)" strokeWidth="1.2" />
        </g>
        <text x={80} y={366} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-vermilion)">
          1 pass &middot; {N_PARAMS} gradients
        </text>

        <line x1={VIEW_W / 2 - 60} y1={398} x2={VIEW_W / 2 + 60} y2={398} stroke="var(--color-vermilion)" strokeWidth="1" />

        <text x={VIEW_W / 2} y={426} textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-ink)">
          one loss · many parameters · go backward
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5b &mdash; A single backward pass for thirteen gradients
      </figcaption>
    </figure>
  )
}
