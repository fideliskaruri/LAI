import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Act 7 — closing thread to Perceptron.
 *
 *  Left  : a small diagram of a one-neuron network. Two input nodes feeding
 *          into a single output node through weighted edges; a small σ
 *          symbol inside the output node; an arrow out the right side that
 *          says "p". This is logistic regression, redrawn so it looks like
 *          a neural network.
 *  Right : a thread card. Logistic regression is the perceptron's softer,
 *          calculus-friendly cousin — same linear scorer, differentiable
 *          activation. Stack them.
 *
 * Static. No interaction. Same shape as linear-regression/Closing.tsx.
 */

const VIEW_W = 600
const VIEW_H = 480

export function LeftPane() {
  // Network coordinates
  const INPUT_X = 160
  const OUTPUT_X = 440
  const Y1 = 180
  const Y2 = 300
  const OUT_Y = 240

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A diagram of a one-neuron network. Two input nodes feed weighted edges into a single output node that applies a sigmoid and emits a probability. This is logistic regression, redrawn to look like a single artificial neuron."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A one-neuron network: two inputs, weighted edges, sigmoid output. The visual identity of logistic regression as a single neuron."
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
          LOGISTIC REGRESSION &middot; AS ONE NEURON
        </text>

        {/* Edges with weights */}
        <line x1={INPUT_X + 18} y1={Y1} x2={OUTPUT_X - 28} y2={OUT_Y} stroke="var(--color-graph-ink)" strokeWidth="1.4" />
        <line x1={INPUT_X + 18} y1={Y2} x2={OUTPUT_X - 28} y2={OUT_Y} stroke="var(--color-graph-ink)" strokeWidth="1.4" />

        {/* Weight labels */}
        <text
          x={(INPUT_X + OUTPUT_X) / 2}
          y={Y1 + 24}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="12"
          fill="var(--color-vermilion)"
        >
          w₁
        </text>
        <text
          x={(INPUT_X + OUTPUT_X) / 2}
          y={Y2 - 8}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="12"
          fill="var(--color-vermilion)"
        >
          w₂
        </text>

        {/* Input nodes */}
        <InputNode x={INPUT_X} y={Y1} label="x₁" />
        <InputNode x={INPUT_X} y={Y2} label="x₂" />

        {/* Bias node — a small dotted circle off to the side */}
        <circle cx={OUTPUT_X - 40} cy={OUT_Y - 80} r="14" fill="none" stroke="var(--color-graph-ink)" strokeDasharray="2 2" />
        <text
          x={OUTPUT_X - 40}
          y={OUT_Y - 76}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="12"
          fill="var(--color-dim)"
        >
          b
        </text>
        <line
          x1={OUTPUT_X - 40}
          y1={OUT_Y - 66}
          x2={OUTPUT_X - 28}
          y2={OUT_Y - 14}
          stroke="var(--color-graph-ink)"
          strokeWidth="1"
          strokeDasharray="2 2"
        />

        {/* Output node */}
        <circle
          cx={OUTPUT_X}
          cy={OUT_Y}
          r="32"
          fill="var(--color-cream)"
          stroke="var(--color-vermilion)"
          strokeWidth="2"
        />
        <text
          x={OUTPUT_X}
          y={OUT_Y + 6}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="20"
          fill="var(--color-vermilion)"
        >
          σ
        </text>

        {/* Arrow out */}
        <line x1={OUTPUT_X + 32} y1={OUT_Y} x2={OUTPUT_X + 110} y2={OUT_Y} stroke="var(--color-graph-ink)" strokeWidth="1.4" />
        <polygon
          points={`${OUTPUT_X + 116},${OUT_Y} ${OUTPUT_X + 108},${OUT_Y - 5} ${OUTPUT_X + 108},${OUT_Y + 5}`}
          fill="var(--color-graph-ink)"
        />
        <text
          x={OUTPUT_X + 80}
          y={OUT_Y - 12}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="12"
          fill="var(--color-ink)"
        >
          p
        </text>

        {/* Computation card under the network */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 96}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="13"
          fill="var(--color-ink)"
        >
          z = w₁ · x₁ + w₂ · x₂ + b
        </text>
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 74}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          p = σ(z)
        </text>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 48}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          a linear scorer, then a sigmoid &mdash; one neuron, one chapter
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6a &mdash; The same model, drawn as a neural network
      </figcaption>
    </figure>
  )
}

function InputNode({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r="18" fill="var(--color-cream)" stroke="var(--color-graph-ink)" strokeWidth="1.4" />
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize="13"
        fill="var(--color-ink)"
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
        text="A thread card. Logistic regression is the perceptron's softer, differentiable cousin: same linear scorer, smooth activation, gradient descent. Stack many of these and you have a neural network. The next chapter visits the perceptron itself — the hard-threshold version, born in 1958."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Thread card forward to the Perceptron chapter."
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
          y="160"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="16"
          fill="var(--color-ink)"
        >
          One neuron. One sigmoid.
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
          One decision boundary.
        </text>

        <text
          x={VIEW_W / 2}
          y="234"
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
          y="284"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-dim)"
        >
          The next chapter goes back to 1958
        </text>
        <text
          x={VIEW_W / 2}
          y="304"
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="14"
          fill="var(--color-dim)"
        >
          for the perceptron &mdash; the original one-neuron model.
        </text>

        <line
          x1={VIEW_W / 2 - 40}
          y1="344"
          x2={VIEW_W / 2 + 40}
          y2="344"
          stroke="var(--color-vermilion)"
          strokeWidth="1"
        />

        <text
          x={VIEW_W / 2}
          y="376"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          NEXT &middot; PERCEPTRON &middot; ROSENBLATT 1958
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
          a logistic regression is a one-neuron neural network
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6b &mdash; The chapter ends; the network begins
      </figcaption>
    </figure>
  )
}
