import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { VIEW_W, VIEW_H } from './conv'

/**
 * Act 8 — closing.
 *
 *  Left  : a "lineage" diagram of computer-vision milestones — Fukushima's
 *          Neocognitron 1980; LeCun's LeNet 1989/1998; Krizhevsky's AlexNet
 *          2012; the Vision Transformer 2020.
 *  Right : a thread card forward to transformers.
 *
 * Static.
 */

interface Stop {
  x: number
  year: string
  glyph: string
  caption: string
  accent?: boolean
}

export function LeftPane() {
  const stops: Stop[] = [
    { x: 110, year: '1980', glyph: '◇', caption: 'Neocognitron', accent: true },
    { x: 250, year: '1989', glyph: '▣', caption: 'LeNet', accent: true },
    { x: 390, year: '2012', glyph: '✶', caption: 'AlexNet', accent: true },
    { x: VIEW_W - 110, year: '2020', glyph: '☼', caption: 'ViT' },
  ]
  const yMid = 230

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A lineage of computer-vision architectures. Kunihiko Fukushima's Neocognitron in 1980 introduced the convolution-and-pool idea. Yann LeCun's LeNet brought it to backpropagation. Alex Krizhevsky's AlexNet won ImageNet by a huge margin in 2012 and started the modern era. The Vision Transformer in 2020 began the slow handoff from convolutions to attention."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A lineage of computer-vision models from the 1980 Neocognitron through LeNet, AlexNet, and the Vision Transformer."
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
          y="80"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          FORTY YEARS OF SEEING
        </text>

        {/* Arrows */}
        {stops.slice(0, -1).map((s, i) => {
          const next = stops[i + 1]
          return (
            <g key={`a-${i}`}>
              <line
                x1={s.x + 24}
                y1={yMid}
                x2={next.x - 24}
                y2={yMid}
                stroke="var(--color-graph-ink)"
                strokeWidth="1.4"
              />
              <polygon
                points={`${next.x - 18},${yMid} ${next.x - 26},${yMid - 4} ${next.x - 26},${yMid + 4}`}
                fill="var(--color-graph-ink)"
              />
            </g>
          )
        })}

        {/* Nodes */}
        {stops.map((s, i) => (
          <g key={i}>
            <circle
              cx={s.x}
              cy={yMid}
              r="22"
              fill="var(--color-cream)"
              stroke={s.accent ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
              strokeWidth={s.accent ? 2 : 1.4}
            />
            <text
              x={s.x}
              y={yMid + 8}
              textAnchor="middle"
              fontFamily="Source Serif 4, Georgia, serif"
              fontSize="20"
              fill={s.accent ? 'var(--color-vermilion)' : 'var(--color-ink)'}
            >
              {s.glyph}
            </text>
            <text
              x={s.x}
              y={yMid + 50}
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="11"
              fill="var(--color-dim)"
            >
              {s.year}
            </text>
            <text
              x={s.x}
              y={yMid + 68}
              textAnchor="middle"
              fontFamily="Source Serif 4, Georgia, serif"
              fontStyle="italic"
              fontSize="12"
              fill="var(--color-dim)"
            >
              {s.caption}
            </text>
          </g>
        ))}

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 86}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          one idea, four eras
        </text>
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 64}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-vermilion)"
        >
          weight sharing across space
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 7a &mdash; The forty years of computer vision
      </figcaption>
    </figure>
  )
}

export function RightPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="The chapter ends. The next chapter is transformers — what happens when the architecture lets each token look at any other token, not just its neighbours. Convolutions are local; attention is global. The training algorithm stays the same."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A thread card forward to the transformers chapter. Convolutions are local; attention is global."
      >
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
          WHAT WE GOT · WHAT COMES NEXT
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
          Share weights across space.
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
          Slide. Sum. Pool. Repeat.
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
          The picture becomes a vector.
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
          Convolutions look locally.
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
          Transformers look everywhere.
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
          The backward pass survives.
        </text>

        <line
          x1={VIEW_W / 2 - 40}
          y1={356}
          x2={VIEW_W / 2 + 40}
          y2={356}
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
          NEXT · TRANSFORMERS
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
          a different wiring, the same loop
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 7b &mdash; The chapter ends; the long handoff begins
      </figcaption>
    </figure>
  )
}
