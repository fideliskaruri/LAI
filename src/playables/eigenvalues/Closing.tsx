import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Act 7 — closing: a static collage of three pocket-sized visual hints,
 * each one a place eigenvalues show up. Three lightweight motifs share
 * the canvas:
 *
 *   - PageRank: a directed graph of five nodes; the steady-state
 *     distribution (the dominant eigenvector of the transition matrix)
 *     sets the size of each node.
 *   - Vibration: a sine standing wave on a string (the first mode); a
 *     fainter second mode behind it.
 *   - Weight matrix: a grid of pale and vermilion cells, with two
 *     vermilion arrows along its principal singular directions.
 *
 * No interaction — this is a thread-tying card, not a playable.
 */

const VIEW_W = 600
const VIEW_H = 480

export function Closing() {
  return (
    <figure className="w-full">
      <CanvasNarrative
        text="A closing card with three small panels. Left: a small directed graph for PageRank. Center: a sine standing wave for vibration modes. Right: a weight-matrix grid with two principal directions. Each is a place eigenvalues show up."
        priority="normal"
      />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label="A closing collage with three motifs: a PageRank-style directed graph, a vibrating-string standing wave, and a weight-matrix grid with two principal directions overlaid."
      >
        {/* Header band */}
        <text
          x={VIEW_W / 2}
          y="44"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.28em"
          fill="var(--color-dim)"
        >
          EIGEN-THINGS  ·  THREE PLACES THEY SHOW UP
        </text>

        {/* Panel rules — three columns */}
        <line x1="210" y1="80" x2="210" y2="380" stroke="var(--color-graph-fade)" strokeWidth="1" />
        <line x1="400" y1="80" x2="400" y2="380" stroke="var(--color-graph-fade)" strokeWidth="1" />

        {/* === Panel 1: PageRank === */}
        <g>
          <text
            x="105"
            y="100"
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="14"
            fill="var(--color-ink)"
          >
            PageRank
          </text>
          <PageRankGraph />
          <text
            x="105"
            y="370"
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="11"
            fill="var(--color-dim)"
          >
            steady-state vector
          </text>
        </g>

        {/* === Panel 2: Vibration === */}
        <g>
          <text
            x="305"
            y="100"
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="14"
            fill="var(--color-ink)"
          >
            Vibration modes
          </text>
          <VibrationModes />
          <text
            x="305"
            y="370"
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="11"
            fill="var(--color-dim)"
          >
            standing waves of a string
          </text>
        </g>

        {/* === Panel 3: Weight matrix === */}
        <g>
          <text
            x="500"
            y="100"
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="14"
            fill="var(--color-ink)"
          >
            Weight matrices
          </text>
          <WeightMatrix />
          <text
            x="500"
            y="370"
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontStyle="italic"
            fontSize="11"
            fill="var(--color-dim)"
          >
            principal directions of a layer
          </text>
        </g>

        {/* Bottom thread */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 40}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="13"
          fill="var(--color-dim)"
        >
          three problems, one piece of algebra
        </text>
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 18}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-vermilion)"
        >
          NEXT  ·  PCA  ·  HOW THE AXES THAT MATTER GET CHOSEN
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 6 &mdash; The same idea, three different rooms
      </figcaption>
    </figure>
  )
}

function PageRankGraph() {
  // Five nodes with hand-set positions inside the panel x: 20..200, y:120..340
  // Sizes proportional to a steady-state distribution (tuned by hand).
  const nodes = [
    { x: 110, y: 140, r: 14, w: 0.32 },
    { x: 55, y: 200, r: 10, w: 0.18 },
    { x: 160, y: 200, r: 12, w: 0.24 },
    { x: 75, y: 290, r: 8, w: 0.12 },
    { x: 150, y: 295, r: 9, w: 0.14 },
  ]
  // Directed edges — node i -> node j
  const edges: [number, number][] = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 0],
    [2, 4],
    [3, 0],
    [4, 2],
    [4, 3],
  ]
  return (
    <g>
      {edges.map(([i, j], k) => {
        const a = nodes[i]
        const b = nodes[j]
        const ang = Math.atan2(b.y - a.y, b.x - a.x)
        // shrink end so the arrowhead sits at the node's edge
        const tipX = b.x - b.r * Math.cos(ang)
        const tipY = b.y - b.r * Math.sin(ang)
        const startX = a.x + a.r * Math.cos(ang)
        const startY = a.y + a.r * Math.sin(ang)
        const headLen = 7
        const headWide = 3.4
        const p1x = tipX - headLen * Math.cos(ang) + headWide * Math.cos(ang + Math.PI / 2)
        const p1y = tipY - headLen * Math.sin(ang) + headWide * Math.sin(ang + Math.PI / 2)
        const p2x = tipX - headLen * Math.cos(ang) - headWide * Math.cos(ang + Math.PI / 2)
        const p2y = tipY - headLen * Math.sin(ang) - headWide * Math.sin(ang + Math.PI / 2)
        return (
          <g key={k}>
            <line
              x1={startX}
              y1={startY}
              x2={tipX}
              y2={tipY}
              stroke="var(--color-graph-ink)"
              strokeOpacity="0.55"
              strokeWidth="1.2"
            />
            <polygon
              points={`${tipX},${tipY} ${p1x},${p1y} ${p2x},${p2y}`}
              fill="var(--color-graph-ink)"
              fillOpacity="0.55"
            />
          </g>
        )
      })}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={n.r} fill="var(--color-vermilion)" fillOpacity={0.65} />
          <text
            x={n.x}
            y={n.y + 4}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="10"
            fill="var(--color-cream)"
          >
            {n.w.toFixed(2)}
          </text>
        </g>
      ))}
    </g>
  )
}

function VibrationModes() {
  // Two standing waves between x=230 and x=380 on a baseline y=230.
  const X0 = 230
  const X1 = 380
  const Y = 230
  const N = 80
  const amp = 38
  const fundamental: string[] = []
  const second: string[] = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const x = X0 + t * (X1 - X0)
    const yA = Y - amp * Math.sin(Math.PI * t)
    const yB = Y - 0.55 * amp * Math.sin(2 * Math.PI * t)
    fundamental.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${yA.toFixed(2)}`)
    second.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${yB.toFixed(2)}`)
  }
  return (
    <g>
      {/* String anchors */}
      <line x1={X0} y1={Y} x2={X1} y2={Y} stroke="var(--color-graph-fade)" strokeWidth="1" />
      <circle cx={X0} cy={Y} r="3" fill="var(--color-graph-ink)" />
      <circle cx={X1} cy={Y} r="3" fill="var(--color-graph-ink)" />

      {/* Second mode in the background — faint */}
      <path d={second.join(' ')} fill="none" stroke="var(--color-vermilion)" strokeOpacity="0.35" strokeWidth="1.4" />

      {/* First mode in front */}
      <path d={fundamental.join(' ')} fill="none" stroke="var(--color-vermilion)" strokeWidth="2.2" />

      {/* Labels */}
      <text
        x={X1 + 6}
        y={Y - amp * 0.86}
        fontFamily="Source Serif 4, Georgia, serif"
        fontStyle="italic"
        fontSize="11"
        fill="var(--color-vermilion)"
      >
        mode 1
      </text>
      <text
        x={X1 + 6}
        y={Y - amp * 0.34}
        fontFamily="Source Serif 4, Georgia, serif"
        fontStyle="italic"
        fontSize="11"
        fill="var(--color-vermilion)"
        opacity="0.5"
      >
        mode 2
      </text>
    </g>
  )
}

function WeightMatrix() {
  // A 6×6 grid of cells of varying intensity (a stand-in for a weight
  // matrix), then two arrows for its principal directions.
  const X0 = 420
  const Y0 = 130
  const CELL = 22
  const GRID = 6

  // Deterministic intensities — alternating sign-y pattern to look weight-like
  const intensities: number[] = []
  for (let i = 0; i < GRID * GRID; i++) {
    const r = Math.floor(i / GRID)
    const c = i % GRID
    // Smooth pseudo-noise with low-rank flavor: outer product of two patterns
    const u = Math.sin((r + 1) * 1.3) * Math.cos((c + 1) * 0.9)
    intensities.push(u)
  }

  // Principal direction (hand-set so the look matches the cell pattern)
  const cx = X0 + (GRID * CELL) / 2
  const cy = Y0 + (GRID * CELL) / 2
  const a1 = -Math.PI / 6
  const a2 = a1 + Math.PI / 2
  const len1 = 55
  const len2 = 32
  const tip1 = { x: cx + len1 * Math.cos(a1), y: cy + len1 * Math.sin(a1) }
  const tip2 = { x: cx + len2 * Math.cos(a2), y: cy + len2 * Math.sin(a2) }

  return (
    <g>
      {/* Cells */}
      {intensities.map((v, i) => {
        const r = Math.floor(i / GRID)
        const c = i % GRID
        const opacity = Math.min(0.85, Math.abs(v))
        const fill = v >= 0 ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'
        return (
          <rect
            key={i}
            x={X0 + c * CELL}
            y={Y0 + r * CELL}
            width={CELL - 2}
            height={CELL - 2}
            fill={fill}
            fillOpacity={opacity}
          />
        )
      })}

      {/* Principal arrows */}
      <line x1={cx} y1={cy} x2={tip1.x} y2={tip1.y} stroke="var(--color-ink)" strokeWidth="2.4" />
      <circle cx={tip1.x} cy={tip1.y} r="3" fill="var(--color-ink)" />
      <line
        x1={cx}
        y1={cy}
        x2={tip2.x}
        y2={tip2.y}
        stroke="var(--color-ink)"
        strokeOpacity="0.55"
        strokeWidth="2"
      />
      <circle cx={tip2.x} cy={tip2.y} r="3" fill="var(--color-ink)" fillOpacity="0.55" />
    </g>
  )
}
