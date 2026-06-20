import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { VIEW_W, VIEW_H } from './mlp'

/**
 * Act 9 — closing. Forward link to convolutions and transformers.
 *
 *  Left  : a "lineage" diagram — four nodes from MLP (1986) to CNN (1989)
 *          to attention/Transformer (2017) to today. Each accent the same
 *          underlying claim: the architecture grows, but the math is the
 *          same.
 *  Right : a thread card naming the next chapter (Convolutions) and what
 *          stays constant (forward → loss → backward → SGD).
 *
 * Static.
 */

export function LeftPane() {
  const stops = [
    { x: 110, glyph: '∇', sub: '1986', caption: 'MLP / backprop' },
    { x: 240, glyph: '▣', sub: '1989', caption: 'convolutions' },
    { x: 380, glyph: '⇄', sub: '2017', caption: 'attention' },
    { x: VIEW_W - 110, glyph: '☼', sub: 'today', caption: 'transformers' },
  ]
  const yMid = 230

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A lineage diagram tracing four architectures: the multi-layer perceptron with backpropagation in 1986, convolutional networks in 1989, attention and the transformer in 2017, and the trillion-parameter transformers of today. Across all four, the math is the same — forward pass, loss, backward pass, gradient step."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A lineage of four architectures from the 1986 MLP through convolutions and attention to today's transformers."
      >
        <rect x="40" y="40" width={VIEW_W - 80} height={VIEW_H - 80} fill="none" stroke="var(--color-graph-fade)" strokeWidth="1" />
        <text x={VIEW_W / 2} y="80" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="11" letterSpacing="0.22em" fill="var(--color-dim)">
          THE NEXT FORTY YEARS
        </text>

        {/* Arrows between adjacent stops */}
        {stops.slice(0, -1).map((s, i) => {
          const next = stops[i + 1]
          return (
            <g key={i}>
              <line x1={s.x + 24} y1={yMid} x2={next.x - 24} y2={yMid} stroke="var(--color-graph-ink)" strokeWidth="1.4" />
              <polygon points={`${next.x - 18},${yMid} ${next.x - 26},${yMid - 4} ${next.x - 26},${yMid + 4}`} fill="var(--color-graph-ink)" />
            </g>
          )
        })}

        {/* Nodes */}
        {stops.map((s, i) => {
          const accent = i === 0 || i === stops.length - 1
          return (
            <g key={i}>
              <circle
                cx={s.x}
                cy={yMid}
                r={22}
                fill="var(--color-cream)"
                stroke={accent ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
                strokeWidth={accent ? 2 : 1.4}
              />
              <text x={s.x} y={yMid + 8} textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontSize="20" fill={accent ? 'var(--color-vermilion)' : 'var(--color-ink)'}>
                {s.glyph}
              </text>
              <text x={s.x} y={yMid + 50} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="var(--color-dim)">
                {s.sub}
              </text>
              <text x={s.x} y={yMid + 68} textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="12" fill="var(--color-dim)">
                {s.caption}
              </text>
            </g>
          )
        })}

        <text x={VIEW_W / 2} y={VIEW_H - 86} textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-dim)">
          bigger nets, smarter architectures
        </text>
        <text x={VIEW_W / 2} y={VIEW_H - 64} textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-vermilion)">
          the math is the same
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 8a &mdash; The next four decades in four nodes
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="The chapter ends. The next chapter is convolutions — what happens when the architecture knows that its inputs are an image. The math stays the same: forward pass, loss, backward pass, gradient step. Only the wiring changes."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A thread card forward to the convolutions chapter. The math stays the same; only the wiring changes."
      >
        <rect x="60" y="60" width={VIEW_W - 120} height={VIEW_H - 120} fill="none" stroke="var(--color-graph-fade)" strokeWidth="1" />
        <text x={VIEW_W / 2} y="100" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="11" letterSpacing="0.22em" fill="var(--color-dim)">
          WHAT WE GOT · WHAT COMES NEXT
        </text>

        <text x={VIEW_W / 2} y="158" textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="16" fill="var(--color-ink)">
          Forward. Loss. Backward.
        </text>
        <text x={VIEW_W / 2} y="184" textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="16" fill="var(--color-ink)">
          Gradient step. Repeat.
        </text>

        <text x={VIEW_W / 2} y="232" textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="16" fill="var(--color-vermilion)">
          The recipe doesn&rsquo;t change.
        </text>

        <text x={VIEW_W / 2} y="282" textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-dim)">
          Convolutions add a constraint —
        </text>
        <text x={VIEW_W / 2} y="302" textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-dim)">
          weight-sharing for pictures.
        </text>
        <text x={VIEW_W / 2} y="322" textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="14" fill="var(--color-dim)">
          The training loop survives intact.
        </text>

        <line x1={VIEW_W / 2 - 40} y1={356} x2={VIEW_W / 2 + 40} y2={356} stroke="var(--color-vermilion)" strokeWidth="1" />

        <text x={VIEW_W / 2} y="388" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-vermilion)">
          NEXT · CONVOLUTIONS
        </text>

        <text x={VIEW_W / 2} y={VIEW_H - 80} textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontStyle="italic" fontSize="13" fill="var(--color-dim)">
          one rule for learning &mdash; many shapes for the box
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 8b &mdash; The chapter ends; the architecture begins
      </figcaption>
    </figure>
  )
}
