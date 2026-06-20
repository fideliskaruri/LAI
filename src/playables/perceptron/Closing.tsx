import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Act 8 — closing. The thread forward to MLP / Backprop.
 *
 *  Left  : a small "lineage" diagram. 1958 perceptron → 1969 XOR → 1986
 *          backprop → modern deep network. Five circles with arrows
 *          between them and a year under each.
 *  Right : a thread card. What we learned; what comes next.
 *
 * Static.
 */

const VIEW_W = 600
const VIEW_H = 480

export function LeftPane() {
  // Five nodes along a horizontal lineage with year labels.
  const nodes = [
    { x: 100, label: '1', sub: '1958', caption: 'perceptron' },
    { x: 220, label: '?', sub: '1969', caption: 'XOR' },
    { x: 340, label: '∇', sub: '1986', caption: 'backprop' },
    { x: 460, label: '⋯', sub: '2012', caption: 'deep nets' },
    { x: VIEW_W - 80, label: '☼', sub: 'today', caption: 'GPT et al.' },
  ]
  const Y = 230

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A lineage diagram tracing five steps from the 1958 perceptron through the 1969 XOR crisis and the 1986 backpropagation paper to modern deep networks. Each node is one milestone."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A lineage diagram from the 1958 perceptron to today's deep networks: five nodes labelled with their year and milestone."
      >
        {/* Frame */}
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
          y="80"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THE LINEAGE
        </text>

        {/* Arrows between consecutive nodes */}
        {nodes.slice(0, -1).map((n, i) => {
          const next = nodes[i + 1]
          return (
            <g key={i}>
              <line
                x1={n.x + 22}
                y1={Y}
                x2={next.x - 22}
                y2={Y}
                stroke="var(--color-graph-ink)"
                strokeWidth="1.2"
              />
              <polygon
                points={`${next.x - 16},${Y} ${next.x - 24},${Y - 4} ${next.x - 24},${Y + 4}`}
                fill="var(--color-graph-ink)"
              />
            </g>
          )
        })}

        {/* Nodes */}
        {nodes.map((n, i) => {
          const isXor = i === 1
          const accent = i === 0 || i === 2
          return (
            <g key={i}>
              <circle
                cx={n.x}
                cy={Y}
                r={20}
                fill="var(--color-cream)"
                stroke={
                  isXor
                    ? 'var(--color-graph-ink)'
                    : accent
                      ? 'var(--color-vermilion)'
                      : 'var(--color-graph-ink)'
                }
                strokeWidth={accent ? 2 : 1.4}
                strokeDasharray={isXor ? '3 3' : undefined}
              />
              <text
                x={n.x}
                y={Y + 6}
                textAnchor="middle"
                fontFamily="Source Serif 4, Georgia, serif"
                fontSize="18"
                fill={accent ? 'var(--color-vermilion)' : 'var(--color-ink)'}
              >
                {n.label}
              </text>
              <text
                x={n.x}
                y={Y + 46}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="11"
                fill="var(--color-dim)"
              >
                {n.sub}
              </text>
              <text
                x={n.x}
                y={Y + 64}
                textAnchor="middle"
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="12"
                fill="var(--color-dim)"
              >
                {n.caption}
              </text>
            </g>
          )
        })}

        {/* Caption */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 70}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          one neuron &mdash; two limitations &mdash; one fix &mdash; a flood
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 7a &mdash; The lineage in five nodes
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="The chapter ends. The perceptron is the simplest learnable model — and its failure on XOR is what made every subsequent advance necessary. The next chapter introduces the MLP and backpropagation, the algorithms that made the perceptron's dream operational."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Thread card forward to the MLP and backpropagation chapter."
      >
        {/* Frame */}
        <rect
          x="60"
          y="60"
          width={VIEW_W - 120}
          height={VIEW_H - 120}
          fill="none"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        <text
          x={VIEW_W / 2}
          y="100"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          WHAT WE GOT &middot; WHAT COMES NEXT
        </text>

        <text
          x={VIEW_W / 2}
          y="158"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-ink)"
        >
          One neuron. One step function.
        </text>
        <text
          x={VIEW_W / 2}
          y="184"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-ink)"
        >
          One learning rule.
        </text>

        <text
          x={VIEW_W / 2}
          y="232"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-vermilion)"
        >
          What if we stacked them?
        </text>

        <text
          x={VIEW_W / 2}
          y="282"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-dim)"
        >
          The next chapter visits the multi-layer
        </text>
        <text
          x={VIEW_W / 2}
          y="302"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-dim)"
        >
          perceptron, and the chain rule that
        </text>
        <text
          x={VIEW_W / 2}
          y="322"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-dim)"
        >
          taught it to learn.
        </text>

        <line
          x1={VIEW_W / 2 - 40}
          y1="356"
          x2={VIEW_W / 2 + 40}
          y2="356"
          stroke="var(--color-vermilion)"
          strokeWidth="1"
        />

        <text
          x={VIEW_W / 2}
          y="388"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          NEXT &middot; MLP / BACKPROP
        </text>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 80}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          a perceptron is one neuron &mdash; a network is many
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 7b &mdash; The chapter ends; the network begins
      </figcaption>
    </figure>
  )
}
