import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Act 7 — the fix was hidden layers.
 *
 *  Left  : a sketch of a two-layer network (the smallest MLP). Two inputs,
 *          two hidden neurons (the "hidden layer"), one output. This is the
 *          architecture that famously solves XOR. The hidden neurons carve
 *          the input space into half-planes; the output neuron combines
 *          their answers.
 *  Right : a sidebar — Rumelhart, Hinton, Williams 1986. A paragraph card
 *          naming the paper that revived neural networks by showing how to
 *          train the hidden layer with the chain rule.
 *
 * Static.
 */

const VIEW_W = 600
const VIEW_H = 480

export function LeftPane() {
  // Network coordinates: two inputs → two hidden → one output
  const IN_X = 120
  const HID_X = 320
  const OUT_X = 500
  const IN_Y1 = 200
  const IN_Y2 = 300
  const HID_Y1 = 180
  const HID_Y2 = 320
  const OUT_Y = 250

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A two-layer network. Two inputs feed two hidden neurons; the hidden neurons feed one output neuron. The hidden layer is what gives the network the capacity to draw a non-linear boundary — enough to solve XOR. This is the architecture Rumelhart, Hinton, and Williams trained with backpropagation in 1986."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A two-layer neural network with one hidden layer of two neurons. The architecture that solves XOR."
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
          ADD A HIDDEN LAYER &middot; SOLVE XOR
        </text>

        {/* Layer labels */}
        <text
          x={IN_X}
          y={120}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          INPUT
        </text>
        <text
          x={HID_X}
          y={120}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          HIDDEN
        </text>
        <text
          x={OUT_X}
          y={120}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          OUTPUT
        </text>

        {/* Edges input → hidden */}
        {[
          [IN_Y1, HID_Y1],
          [IN_Y1, HID_Y2],
          [IN_Y2, HID_Y1],
          [IN_Y2, HID_Y2],
        ].map(([y1, y2], i) => (
          <line
            key={`ih-${i}`}
            x1={IN_X + 18}
            y1={y1}
            x2={HID_X - 18}
            y2={y2}
            stroke="var(--color-graph-ink)"
            strokeWidth="1.2"
          />
        ))}

        {/* Edges hidden → output */}
        {[HID_Y1, HID_Y2].map((y, i) => (
          <line
            key={`ho-${i}`}
            x1={HID_X + 22}
            y1={y}
            x2={OUT_X - 22}
            y2={OUT_Y}
            stroke="var(--color-vermilion)"
            strokeWidth="1.4"
          />
        ))}

        {/* Nodes */}
        <Node x={IN_X} y={IN_Y1} label="x" />
        <Node x={IN_X} y={IN_Y2} label="y" />
        <Node x={HID_X} y={HID_Y1} label="h₁" accent />
        <Node x={HID_X} y={HID_Y2} label="h₂" accent />
        <Node x={OUT_X} y={OUT_Y} label="ŷ" output />

        {/* Output arrow */}
        <line
          x1={OUT_X + 22}
          y1={OUT_Y}
          x2={OUT_X + 60}
          y2={OUT_Y}
          stroke="var(--color-graph-ink)"
          strokeWidth="1.4"
        />
        <polygon
          points={`${OUT_X + 66},${OUT_Y} ${OUT_X + 58},${OUT_Y - 5} ${OUT_X + 58},${OUT_Y + 5}`}
          fill="var(--color-graph-ink)"
        />

        {/* Bottom caption */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 96}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          the hidden layer carves space into halves
        </text>
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 76}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          the output layer recombines them
        </text>
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 50}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          curves emerge from stacked lines
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6a &mdash; One hidden layer is enough
      </figcaption>
    </figure>
  )
}

function Node({
  x,
  y,
  label,
  accent,
  output,
}: {
  x: number
  y: number
  label: string
  accent?: boolean
  output?: boolean
}) {
  const stroke = accent || output ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={output ? 22 : 18}
        fill="var(--color-cream)"
        stroke={stroke}
        strokeWidth={output ? 2 : 1.4}
      />
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize="12"
        fill={accent || output ? 'var(--color-vermilion)' : 'var(--color-ink)'}
      >
        {label}
      </text>
    </g>
  )
}

export function RightPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="The fix was hidden layers, and the unlock was backpropagation. Rumelhart, Hinton, and Williams, in their 1986 paper in Nature, showed that the chain rule could push gradients backward through stacked layers — and the field came back from the winter."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A sidebar card naming the 1986 backpropagation paper by Rumelhart, Hinton, and Williams."
      >
        {/* Frame — newsprint-ish */}
        <rect
          x="60"
          y="60"
          width={VIEW_W - 120}
          height={VIEW_H - 120}
          fill="var(--color-paper)"
          stroke="var(--color-graph-fade)"
          strokeWidth="1"
        />

        <text
          x={VIEW_W / 2}
          y="106"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          NATURE &middot; 9 OCTOBER 1986
        </text>

        <text
          x={VIEW_W / 2}
          y="158"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="20"
          fontWeight="600"
          fill="var(--color-paper-ink)"
        >
          Learning representations
        </text>
        <text
          x={VIEW_W / 2}
          y="184"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontSize="20"
          fontWeight="600"
          fill="var(--color-paper-ink)"
        >
          by back-propagating errors
        </text>

        <text
          x={VIEW_W / 2}
          y="218"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          D. E. Rumelhart &middot; G. E. Hinton &middot; R. J. Williams
        </text>

        <line
          x1={VIEW_W / 2 - 60}
          y1="244"
          x2={VIEW_W / 2 + 60}
          y2="244"
          stroke="var(--color-vermilion)"
          strokeWidth="1"
        />

        <text
          x={VIEW_W / 2}
          y="278"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-paper-ink)"
        >
          Stack the neurons.
        </text>
        <text
          x={VIEW_W / 2}
          y="298"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-paper-ink)"
        >
          Push the gradient backward.
        </text>
        <text
          x={VIEW_W / 2}
          y="318"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-paper-ink)"
        >
          Train every layer at once.
        </text>

        <text
          x={VIEW_W / 2}
          y="364"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          The winter ended in October 1986.
        </text>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 90}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          NEXT CHAPTER &middot; MLP / BACKPROP
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6b &mdash; The paper that ended the winter
      </figcaption>
    </figure>
  )
}
