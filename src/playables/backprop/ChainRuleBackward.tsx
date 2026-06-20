import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { VIEW_W, VIEW_H } from './mlp'

/**
 * Act 5 — the chain rule, applied backward.
 *
 *  Left  : a "graph" of the calculation broken into atomic steps.
 *          x → z_h → h → z_o → y → L. Six nodes in a row. Each adjacent
 *          pair has a local derivative under it (dz_h/dx = W, dh/dz_h =
 *          σ', etc.). The reader can see the chain laid out as a sequence
 *          of small pieces.
 *  Right : the chain rule applied to the output and hidden layers. Two
 *          stacked equations. The output gradient is the easy one; the
 *          hidden gradient is the same one with one more factor on the
 *          right. Sidebar: Leibniz, 1676 — the chain rule has been on the
 *          shelf for over three centuries.
 *
 * Static. No interaction. The equations have a vermilion thread through
 * them showing the recursive structure.
 */

export function LeftPane() {
  // Six nodes: x → z_h → h → z_o → y → L
  const stops = [
    { label: 'x', sub: 'input' },
    { label: 'z_h', sub: 'pre-act, hid' },
    { label: 'h', sub: 'act, hid' },
    { label: 'z_o', sub: 'pre-act, out' },
    { label: 'y', sub: 'act, out' },
    { label: 'L', sub: 'loss' },
  ]
  const yMid = 220
  const xs = stops.map((_, i) => 80 + i * 88)

  // Local derivative labels for each gap between stops.
  const locals = [
    { label: '∂z_h / ∂x  =  W' },
    { label: '∂h / ∂z_h  =  σ′(z_h)' },
    { label: '∂z_o / ∂h  =  V' },
    { label: '∂y / ∂z_o  =  σ′(z_o)' },
    { label: '∂L / ∂y  =  y − t' },
  ]

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A chain of six nodes laid out left to right: input x, hidden pre-activation z h, hidden activation h, output pre-activation z o, output y, loss L. Under each arrow is the local derivative of the next quantity with respect to the previous — the chain rule's pieces, written out explicitly."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A chain of six computational nodes from input to loss, with the local derivative of each step labelled beneath."
      >
        <rect x="40" y="40" width={VIEW_W - 80} height={VIEW_H - 80} fill="none" stroke="var(--color-graph-fade)" strokeWidth="1" />
        <text x={VIEW_W / 2} y="80" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="11" letterSpacing="0.22em" fill="var(--color-dim)">
          THE COMPUTATION AS A CHAIN
        </text>

        {/* Arrows between adjacent stops */}
        {locals.map((l, i) => {
          const xA = xs[i]
          const xB = xs[i + 1]
          const midX = (xA + xB) / 2
          return (
            <g key={i}>
              <line x1={xA + 18} y1={yMid} x2={xB - 18} y2={yMid} stroke="var(--color-graph-ink)" strokeWidth="1.4" />
              <polygon points={`${xB - 12},${yMid} ${xB - 20},${yMid - 4} ${xB - 20},${yMid + 4}`} fill="var(--color-graph-ink)" />
              <text x={midX} y={yMid + 36} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="var(--color-vermilion)">
                {l.label}
              </text>
            </g>
          )
        })}

        {/* Stops */}
        {stops.map((s, i) => (
          <g key={i}>
            <circle cx={xs[i]} cy={yMid} r="18" fill="var(--color-cream)" stroke="var(--color-vermilion)" strokeWidth="1.6" />
            <text x={xs[i]} y={yMid + 4} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-vermilion)">
              {s.label}
            </text>
            <text x={xs[i]} y={yMid - 28} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="var(--color-dim)">
              {s.sub}
            </text>
          </g>
        ))}

        {/* The recursive thread */}
        <text x={VIEW_W / 2} y={330} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          MULTIPLY ALONG THE CHAIN, RIGHT TO LEFT
        </text>
        <text x={VIEW_W / 2} y={358} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="14" fill="var(--color-vermilion)">
          ∂L/∂W  =  ∂L/∂y · ∂y/∂z_o · ∂z_o/∂h · ∂h/∂z_h · ∂z_h/∂W
        </text>

        <text x={VIEW_W / 2} y={VIEW_H - 56} textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-dim)">
          one product per arrow &mdash; that is all the chain rule is
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4a &mdash; The chain, drawn as a chain
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="The chain rule for two layers. For the output weight V, the gradient is the product of d L by d y and d y by d V. For the hidden weight W, the gradient is the same product extended by two more factors — d y by d h and d h by d W. The chain rule was published by Leibniz in 1676; backpropagation is just applying it to a graph."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Two stacked equations: the chain rule for the output weights and the same rule extended for the hidden weights. Below, a note that Leibniz published the chain rule in 1676."
      >
        <rect x="40" y="40" width={VIEW_W - 80} height={VIEW_H - 80} fill="none" stroke="var(--color-graph-fade)" strokeWidth="1" />
        <text x={VIEW_W / 2} y="80" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="11" letterSpacing="0.22em" fill="var(--color-dim)">
          THE CHAIN RULE · TWO LAYERS
        </text>

        {/* Output layer equation */}
        <text x={VIEW_W / 2} y={140} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          OUTPUT LAYER · WEIGHT V
        </text>
        <text x={VIEW_W / 2} y={170} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="15" fill="var(--color-ink)">
          ∂L/∂V  =  ∂L/∂y · ∂y/∂V
        </text>
        <text x={VIEW_W / 2} y={194} textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="12" fill="var(--color-dim)">
          one factor for the loss, one for the neuron
        </text>

        {/* Hidden layer equation */}
        <text x={VIEW_W / 2} y={246} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-vermilion)">
          HIDDEN LAYER · WEIGHT W
        </text>
        <text x={VIEW_W / 2} y={276} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="15" fill="var(--color-vermilion)">
          ∂L/∂W  =  ∂L/∂y · ∂y/∂h · ∂h/∂W
        </text>
        <text x={VIEW_W / 2} y={300} textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="12" fill="var(--color-dim)">
          same chain, with one more link on the right
        </text>

        <line x1={VIEW_W / 2 - 60} y1={336} x2={VIEW_W / 2 + 60} y2={336} stroke="var(--color-vermilion)" strokeWidth="1" />

        {/* Leibniz sidebar */}
        <text x={VIEW_W / 2} y={368} textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-ink)">
          The chain rule was published in
        </text>
        <text x={VIEW_W / 2} y={386} textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-ink)">
          Leibniz&rsquo;s notebooks in 1676.
        </text>
        <text x={VIEW_W / 2} y={406} textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-dim)">
          Backprop is the same rule applied to a graph.
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 4b &mdash; A 350-year-old idea, freshly useful
      </figcaption>
    </figure>
  )
}
