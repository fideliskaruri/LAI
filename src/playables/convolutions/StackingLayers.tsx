import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { VIEW_W, VIEW_H } from './conv'

/**
 * Act 7 — stacking layers.
 *
 *  Left  : a horizontal cartoon of LeNet — input image, conv1, pool1, conv2,
 *          pool2, fully connected, output. Each block is shown as a small
 *          stack of feature-map cards whose footprint shrinks with depth.
 *  Right : the receptive-field idea — at each depth, what does a single
 *          activation "see"? Edges in conv1, motifs in conv2, parts/objects
 *          after the fully-connected layer.
 *
 * Static.
 */

interface Block {
  x: number
  label: string
  caption: string
  // Cards: shrinking footprint to suggest pooling, more cards as channels grow.
  cards: number
  size: number
}

export function LeftPane() {
  const BLOCKS: Block[] = [
    { x: 90, label: 'INPUT', caption: '32×32', cards: 1, size: 60 },
    { x: 178, label: 'CONV 1', caption: '28×28 · 6 maps', cards: 3, size: 54 },
    { x: 266, label: 'POOL 1', caption: '14×14', cards: 3, size: 44 },
    { x: 354, label: 'CONV 2', caption: '10×10 · 16 maps', cards: 5, size: 38 },
    { x: 442, label: 'POOL 2', caption: '5×5', cards: 5, size: 28 },
    { x: VIEW_W - 90, label: 'FC · OUT', caption: '10 classes', cards: 0, size: 0 },
  ]
  const yMid = 230

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="The architecture of LeNet-5: an input image, two convolution-and-pool blocks, a fully connected layer, and a ten-way output. As you go deeper, the feature maps get smaller in spatial size but greater in number — each layer sees less of the image but understands more."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A horizontal cartoon of the LeNet-5 architecture: input, conv, pool, conv, pool, fully connected, output."
      >
        <text
          x={VIEW_W / 2}
          y="40"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          A STACK · LENET-5 · LECUN · 1998
        </text>

        {/* Arrows connecting adjacent blocks */}
        {BLOCKS.slice(0, -1).map((b, i) => {
          const next = BLOCKS[i + 1]
          const x1 = b.x + Math.max(20, b.size / 2 + 4)
          const x2 = next.x - Math.max(20, next.size / 2 + 6)
          return (
            <g key={`arr-${i}`}>
              <line
                x1={x1}
                y1={yMid}
                x2={x2 - 6}
                y2={yMid}
                stroke="var(--color-graph-ink)"
                strokeWidth="1.2"
              />
              <polygon
                points={`${x2 - 2},${yMid} ${x2 - 10},${yMid - 4} ${x2 - 10},${yMid + 4}`}
                fill="var(--color-graph-ink)"
              />
            </g>
          )
        })}

        {/* Blocks */}
        {BLOCKS.map((b, idx) => {
          const isLast = idx === BLOCKS.length - 1
          return (
            <g key={b.label} transform={`translate(${b.x}, ${yMid})`}>
              {isLast ? (
                <>
                  <circle
                    cx={0}
                    cy={0}
                    r="26"
                    fill="var(--color-cream)"
                    stroke="var(--color-vermilion)"
                    strokeWidth="2"
                  />
                  <text
                    x={0}
                    y={4}
                    textAnchor="middle"
                    fontFamily="Source Serif 4, Georgia, serif"
                    fontSize="20"
                    fill="var(--color-vermilion)"
                  >
                    y
                  </text>
                </>
              ) : (
                // Stack of square cards, offset to suggest depth/channels.
                Array.from({ length: Math.max(1, b.cards) }).map((_, k) => {
                  const offset = k * 4
                  const isLeading = k === b.cards - 1
                  return (
                    <rect
                      key={k}
                      x={-b.size / 2 - offset}
                      y={-b.size / 2 - offset}
                      width={b.size}
                      height={b.size}
                      fill={isLeading ? '#fff4ef' : 'var(--color-cream)'}
                      stroke={
                        idx === 0
                          ? 'var(--color-graph-ink)'
                          : 'var(--color-vermilion)'
                      }
                      strokeWidth={isLeading ? 1.6 : 1}
                    />
                  )
                })
              )}

              <text
                x={0}
                y={isLast ? 56 : b.size / 2 + 28}
                textAnchor="middle"
                fontFamily="Inter, sans-serif"
                fontSize="9"
                letterSpacing="0.22em"
                fill={isLast ? 'var(--color-vermilion)' : 'var(--color-dim)'}
              >
                {b.label}
              </text>
              <text
                x={0}
                y={isLast ? 76 : b.size / 2 + 46}
                textAnchor="middle"
                fontFamily="JetBrains Mono, monospace"
                fontSize="10"
                fill="var(--color-ink)"
              >
                {b.caption}
              </text>
            </g>
          )
        })}

        {/* What each depth notices */}
        <g transform={`translate(0, ${yMid + 124})`}>
          <DepthCaption x={178} label="edges, strokes" />
          <DepthCaption x={354} label="motifs, corners" />
          <DepthCaption x={VIEW_W - 90} label="whole digits" accent />
        </g>

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 18}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          smaller in space · richer in meaning
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6a &mdash; A network with depth
      </figcaption>
    </figure>
  )
}

function DepthCaption({
  x,
  label,
  accent,
}: {
  x: number
  label: string
  accent?: boolean
}) {
  return (
    <g transform={`translate(${x}, 0)`}>
      <line
        x1={0}
        y1={-8}
        x2={0}
        y2={0}
        stroke={accent ? 'var(--color-vermilion)' : 'var(--color-graph-fade)'}
        strokeWidth="1"
      />
      <text
        x={0}
        y={16}
        textAnchor="middle"
        fontFamily="Source Serif 4, Georgia, serif"
        fontStyle="italic"
        fontSize="12"
        fill={accent ? 'var(--color-vermilion)' : 'var(--color-dim)'}
      >
        {label}
      </text>
    </g>
  )
}

/* ============================================================== */
/* RIGHT PANE — hierarchy of features                              */
/* ============================================================== */

export function RightPane() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A hierarchy of features. Low layers detect edges and strokes; middle layers detect corners and small motifs; deep layers detect whole shapes — the digits 0 through 9. None of this hierarchy was hand-designed. It emerges, in every layer, from gradient descent on the labelled data."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A hierarchy of learned features: edges at the bottom, motifs in the middle, whole digits at the top."
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
          A HIERARCHY OF FEATURES
        </text>

        {/* Three layers — vertical stack */}
        <HierarchyRow
          y={150}
          tag="DEEP"
          label="whole digits"
          glyphs={['3', '7', '0', '5']}
          accent
        />
        <HierarchyRow
          y={250}
          tag="MID"
          label="corners · loops · small motifs"
          glyphs={['◜', '◝', '◞', '◟']}
        />
        <HierarchyRow
          y={350}
          tag="LOW"
          label="edges · strokes"
          glyphs={['/', '─', '|', '\\']}
        />

        <text
          x={VIEW_W / 2}
          y={VIEW_H - 88}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          the bottom layer pays attention to pixels;
        </text>
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 68}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          the top layer pays attention to digits.
        </text>
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 36}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="9"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          NONE OF IT HAND-DESIGNED · ALL OF IT LEARNED
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6b &mdash; What the layers, in fact, learn
      </figcaption>
    </figure>
  )
}

function HierarchyRow({
  y,
  tag,
  label,
  glyphs,
  accent,
}: {
  y: number
  tag: string
  label: string
  glyphs: string[]
  accent?: boolean
}) {
  return (
    <g transform={`translate(0, ${y})`}>
      <text
        x={90}
        y={-10}
        fontFamily="Inter, sans-serif"
        fontSize="9"
        letterSpacing="0.22em"
        fill={accent ? 'var(--color-vermilion)' : 'var(--color-dim)'}
      >
        {tag}
      </text>
      {glyphs.map((g, i) => (
        <g key={i}>
          <rect
            x={90 + i * 90}
            y={0}
            width={68}
            height={48}
            fill="var(--color-cream)"
            stroke={accent ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
            strokeWidth={accent ? 1.6 : 1.2}
          />
          <text
            x={90 + i * 90 + 34}
            y={32}
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontWeight={accent ? '600' : '400'}
            fontSize="22"
            fill={accent ? 'var(--color-vermilion)' : 'var(--color-ink)'}
          >
            {g}
          </text>
        </g>
      ))}
      <text
        x={VIEW_W - 70}
        y={32}
        textAnchor="end"
        fontFamily="Source Serif 4, Georgia, serif"
        fontStyle="italic"
        fontSize="12"
        fill="var(--color-dim)"
      >
        {label}
      </text>
    </g>
  )
}
