import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Closing scene for the Optimization chapter. The thread forward.
 *
 * Left: a small bowl-and-ball pictogram in vermilion — gradient descent.
 * Center: a connecting arrow labeled "BECOMES."
 * Right: a sketched neural-network silhouette (three layers of dots with
 * connecting strokes), with a tiny vermilion descent path beneath it —
 * every weight in every neuron is following the rule we just built.
 *
 * Static. The teaching is the thread, not the picture.
 */

const VIEW_W = 600
const VIEW_H = 480

export function Closing() {
  const leftCx = 130
  const leftCy = 240

  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A small bowl-and-ball pictogram on the left. An arrow labelled becomes. On the right, a sketched neural network — three layers of nodes connected by faint lines — with a vermilion descent path beneath. The gradient descent we just built is the workhorse of every neural network's training loop."
        priority="high"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="On the left, a small bowl-and-ball pictogram representing gradient descent. An arrow points right, labelled becomes. On the right, a sketch of a neural network. Caption: gradient descent is the workhorse."
      >
        <text x={36} y={40} fontFamily="Inter, sans-serif" fontSize="10" letterSpacing="0.22em" fill="var(--color-dim)">
          THE THREAD FORWARD
        </text>

        {/* LEFT: bowl + ball + downhill arrow */}
        <g>
          {/* Bowl as a wide vermilion-tinted arc */}
          <path
            d={`M ${leftCx - 80} ${leftCy + 20}
                Q ${leftCx} ${leftCy + 110} ${leftCx + 80} ${leftCy + 20}`}
            fill="none"
            stroke="var(--color-vermilion)"
            strokeWidth="2.2"
          />
          {/* Bowl shading */}
          <path
            d={`M ${leftCx - 80} ${leftCy + 20}
                Q ${leftCx} ${leftCy + 110} ${leftCx + 80} ${leftCy + 20}
                L ${leftCx + 80} ${leftCy + 26}
                Q ${leftCx} ${leftCy + 116} ${leftCx - 80} ${leftCy + 26} Z`}
            fill="var(--color-vermilion)"
            fillOpacity="0.1"
          />
          {/* Dashed descent path on the inside of the bowl */}
          <path
            d={`M ${leftCx - 64} ${leftCy + 36}
                Q ${leftCx - 40} ${leftCy + 92}
                ${leftCx} ${leftCy + 102}`}
            fill="none"
            stroke="var(--color-vermilion)"
            strokeWidth="1.2"
            strokeOpacity="0.55"
            strokeDasharray="3 4"
          />
          {/* Ball at the bottom */}
          <circle cx={leftCx} cy={leftCy + 102} r="7" fill="var(--color-vermilion)" />
          {/* Label */}
          <text
            x={leftCx}
            y={leftCy + 154}
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="13"
            fill="var(--color-dim)"
          >
            gradient descent
          </text>
          <text
            x={leftCx}
            y={leftCy + 174}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill="var(--color-vermilion)"
          >
            Cauchy, 1847
          </text>
        </g>

        {/* CENTER: connecting arrow */}
        <g>
          <line
            x1={230}
            y1={260}
            x2={330}
            y2={260}
            stroke="var(--color-graph-ink)"
            strokeWidth="1.2"
            strokeOpacity="0.6"
          />
          <polygon
            points="336,260 326,256 326,264"
            fill="var(--color-graph-ink)"
            fillOpacity="0.6"
          />
          <text
            x={280}
            y={252}
            textAnchor="middle"
            fontFamily="Inter, sans-serif"
            fontSize="9"
            letterSpacing="0.22em"
            fill="var(--color-dim)"
          >
            BECOMES
          </text>
        </g>

        {/* RIGHT: neural network sketch */}
        <g transform="translate(360, 0)">
          {(() => {
            const layers = [4, 5, 5, 3]
            const xCol = [40, 100, 160, 220]
            const yCenter = 240
            const nodes: Array<{ layer: number; idx: number; x: number; y: number }> = []
            layers.forEach((count, li) => {
              const spacing = 32
              const totalH = (count - 1) * spacing
              for (let i = 0; i < count; i++) {
                const y = yCenter - totalH / 2 + i * spacing
                nodes.push({ layer: li, idx: i, x: xCol[li], y })
              }
            })
            const lines: Array<{ x1: number; y1: number; x2: number; y2: number; key: string }> = []
            for (let li = 0; li < layers.length - 1; li++) {
              const left = nodes.filter((n) => n.layer === li)
              const right = nodes.filter((n) => n.layer === li + 1)
              left.forEach((l) =>
                right.forEach((r) =>
                  lines.push({ x1: l.x, y1: l.y, x2: r.x, y2: r.y, key: `${l.layer}-${l.idx}-${r.idx}` }),
                ),
              )
            }
            return (
              <>
                {lines.map((l) => (
                  <line
                    key={l.key}
                    x1={l.x1}
                    y1={l.y1}
                    x2={l.x2}
                    y2={l.y2}
                    stroke="var(--color-graph-ink)"
                    strokeWidth="0.6"
                    strokeOpacity="0.35"
                  />
                ))}
                {nodes.map((n) => (
                  <circle
                    key={`${n.layer}-${n.idx}`}
                    cx={n.x}
                    cy={n.y}
                    r="6"
                    fill="var(--color-cream)"
                    stroke="var(--color-ink)"
                    strokeWidth="1"
                  />
                ))}
              </>
            )
          })()}
          {/* Descent path beneath the net — same pictogram in miniature */}
          <path
            d="M 30 372 Q 130 410 230 372"
            fill="none"
            stroke="var(--color-vermilion)"
            strokeWidth="1.6"
            strokeOpacity="0.7"
          />
          <circle cx="130" cy="397" r="4" fill="var(--color-vermilion)" />
          <text
            x="130"
            y="430"
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="12"
            fill="var(--color-dim)"
          >
            every weight, descending
          </text>
        </g>

        {/* Caption */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 60}
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize="15"
          fill="var(--color-ink)"
        >
          Every neural network is trained by some variant of this.
        </text>
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 36}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          LOGISTIC  ·  PERCEPTRON  ·  MLP  ·  EVERYTHING DOWNSTREAM
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 7 &mdash; Cauchy's two pages, two centuries later, training the frontier.
      </figcaption>
    </figure>
  )
}
