import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { VIEW_W, VIEW_H, ILLUSTRATIVE_PARAMS, fmt2 } from './mlp'

/**
 * Act 2 — what's between input and output?
 *
 *  Left  : a static SVG of the 2 → 3 → 1 MLP. Every connection is a weighted
 *          edge; every neuron computes a weighted sum then a sigmoid. Layer
 *          labels INPUT / HIDDEN / OUTPUT are above the columns; weight
 *          labels are drawn faintly on the edges (W and V from mlp.ts).
 *  Right : a sidebar describing what the hidden layer is *for*. The hidden
 *          layer transforms the input space so the output can separate
 *          things linearly. Plus the two-line equation set:
 *              h = σ(Wx + b)
 *              y = σ(Vh + c)
 *
 * Static.
 */

const P = ILLUSTRATIVE_PARAMS

// Network coordinates (used by several acts via constants only).
const IN_X = 110
const HID_X = 300
const OUT_X = 490
const IN_Y = [200, 320]
const HID_Y = [150, 250, 350]
const OUT_Y = 250

export function LeftPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A small multi-layer perceptron with two inputs, three hidden neurons, and one output. Six weights connect the inputs to the hidden layer; three more connect the hidden layer to the output. Each neuron computes a weighted sum of its inputs, then squashes the result with a sigmoid. The hidden layer is what gives the network the capacity to represent non-linear patterns."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A multi-layer perceptron with two inputs, three hidden sigmoid neurons, and one sigmoid output."
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
          y="78"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          2 INPUTS · 3 HIDDEN · 1 OUTPUT
        </text>

        {/* Layer labels */}
        <text
          x={IN_X}
          y={108}
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
          y={108}
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
          y={108}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          OUTPUT
        </text>

        {/* Edges input → hidden, with weight labels at midpoint */}
        {IN_Y.map((y1, i) =>
          HID_Y.map((y2, j) => {
            const w = P.W[j][i]
            const mx = (IN_X + HID_X) / 2
            const my = (y1 + y2) / 2
            return (
              <g key={`ih-${i}-${j}`}>
                <line
                  x1={IN_X + 20}
                  y1={y1}
                  x2={HID_X - 20}
                  y2={y2}
                  stroke="var(--color-graph-ink)"
                  strokeWidth="1.2"
                  strokeOpacity={0.55 + 0.45 * Math.min(1, Math.abs(w))}
                />
                <text
                  x={mx}
                  y={my - 4}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9"
                  fill={w >= 0 ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
                >
                  {fmt2(w).trim()}
                </text>
              </g>
            )
          }),
        )}

        {/* Edges hidden → output */}
        {HID_Y.map((y, i) => {
          const v = P.V[i]
          const mx = (HID_X + OUT_X) / 2
          const my = (y + OUT_Y) / 2
          return (
            <g key={`ho-${i}`}>
              <line
                x1={HID_X + 22}
                y1={y}
                x2={OUT_X - 22}
                y2={OUT_Y}
                stroke="var(--color-vermilion)"
                strokeWidth="1.4"
                strokeOpacity={0.55 + 0.45 * Math.min(1, Math.abs(v))}
              />
              <text
                x={mx}
                y={my - 4}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="9"
                fill="var(--color-vermilion)"
              >
                {fmt2(v).trim()}
              </text>
            </g>
          )
        })}

        {/* Input nodes */}
        {IN_Y.map((y, i) => (
          <Node key={`in-${i}`} x={IN_X} y={y} label={`x${i + 1}`} />
        ))}
        {/* Hidden nodes */}
        {HID_Y.map((y, i) => (
          <Node key={`h-${i}`} x={HID_X} y={y} label={`h${i + 1}`} accent />
        ))}
        {/* Output node */}
        <Node x={OUT_X} y={OUT_Y} label="y" output />

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

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 56}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          every edge is a number; every neuron is a sum plus a squash
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1a &mdash; The smallest interesting network
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
        text="The two equations of a one-hidden-layer network. First, h equals sigmoid of W times x plus b — the hidden representation. Second, y equals sigmoid of V times h plus c — the output prediction. The hidden layer transforms the input space so that the output can separate things with a single straight cut."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="The two equations of a one-hidden-layer MLP: h equals sigmoid of W x plus b; y equals sigmoid of V h plus c."
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
          THE NETWORK IN TWO LINES
        </text>

        {/* Hidden layer equation */}
        <text
          x={VIEW_W / 2}
          y="160"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THE HIDDEN LAYER
        </text>
        <text
          x={VIEW_W / 2}
          y="190"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="18"
          fill="var(--color-ink)"
        >
          h = σ(W x + b)
        </text>

        {/* Output equation */}
        <text
          x={VIEW_W / 2}
          y="244"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THE OUTPUT LAYER
        </text>
        <text
          x={VIEW_W / 2}
          y="274"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="18"
          fill="var(--color-vermilion)"
        >
          y = σ(V h + c)
        </text>

        <line
          x1={VIEW_W / 2 - 60}
          y1={310}
          x2={VIEW_W / 2 + 60}
          y2={310}
          stroke="var(--color-vermilion)"
          strokeWidth="1"
        />

        {/* Reading guide */}
        <text
          x={VIEW_W / 2}
          y={344}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-ink)"
        >
          Read it twice. Input → hidden.
        </text>
        <text
          x={VIEW_W / 2}
          y={364}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-ink)"
        >
          Hidden → output. Each line a perceptron,
        </text>
        <text
          x={VIEW_W / 2}
          y={384}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-ink)"
        >
          softened with a smooth squash.
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1b &mdash; The whole model fits in two lines
      </figcaption>
    </figure>
  )
}
