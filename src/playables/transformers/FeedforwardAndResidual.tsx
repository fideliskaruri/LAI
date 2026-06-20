import { useRef, useCallback } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'
import { VIEW_W, VIEW_H } from './tx'

/**
 * Act 5 — One transformer block: feedforward and residual.
 *
 *  Left  : a stylised diagram of one full encoder block. Input flows
 *          through self-attention → add+norm → feed-forward (MLP) →
 *          add+norm → output. Click any sub-component to highlight it.
 *  Right : a card describing the highlighted sub-component, including
 *          a rough parameter count and why the residual is there.
 *
 * Sync : left-drives-right.
 */

export type SubId =
  | 'input'
  | 'self-attn'
  | 'add-norm-1'
  | 'ffn'
  | 'add-norm-2'
  | 'output'
  | 'residual-1'
  | 'residual-2'

export interface BlockState {
  selected: SubId
}

export const INITIAL_BLOCK: BlockState = { selected: 'ffn' }

interface SubDef {
  id: SubId
  label: string
  shortLabel: string
  x: number
  y: number
  w: number
  h: number
  kind: 'box' | 'circle'
}

// Vertical pipeline centred on x=VIEW_W/2.
const CX = VIEW_W / 2
const SUBS: SubDef[] = [
  { id: 'input',      label: 'input',          shortLabel: 'in',     x: CX - 80, y: 410, w: 160, h: 30, kind: 'box' },
  { id: 'self-attn',  label: 'self-attention', shortLabel: 'attn',   x: CX - 100, y: 332, w: 200, h: 44, kind: 'box' },
  { id: 'add-norm-1', label: 'add + norm',     shortLabel: 'add+norm', x: CX - 90, y: 268, w: 180, h: 28, kind: 'box' },
  { id: 'ffn',        label: 'feed-forward',   shortLabel: 'ffn',    x: CX - 100, y: 192, w: 200, h: 44, kind: 'box' },
  { id: 'add-norm-2', label: 'add + norm',     shortLabel: 'add+norm', x: CX - 90, y: 128, w: 180, h: 28, kind: 'box' },
  { id: 'output',     label: 'output',         shortLabel: 'out',    x: CX - 80, y: 72,  w: 160, h: 30, kind: 'box' },
  { id: 'residual-1', label: 'residual ↺',     shortLabel: 'res',    x: CX + 110, y: 300, w: 60, h: 24, kind: 'circle' },
  { id: 'residual-2', label: 'residual ↺',     shortLabel: 'res',    x: CX + 110, y: 160, w: 60, h: 24, kind: 'circle' },
]

const ORDER: SubId[] = SUBS.map((s) => s.id)

const INFO: Record<SubId, { title: string; summary: string; detail: string; numbers: string }> = {
  input: {
    title: 'Input',
    summary: 'A sequence of token vectors, position already added in.',
    detail:
      'Each token entering the block is a vector of length d, with position information already baked in. The block has no knowledge of token strings — only vectors.',
    numbers: 'shape · N × d',
  },
  'self-attn': {
    title: 'Self-attention',
    summary: 'Every token looks at every other token in parallel.',
    detail:
      'Projects each token into Q, K, V; computes softmax(Q Kᵀ / √dₖ) V. Multi-head version runs h such heads in parallel and concatenates the result.',
    numbers: 'params · 4 d² (Wq, Wk, Wv, Wo)',
  },
  'add-norm-1': {
    title: 'Add + LayerNorm',
    summary: 'The skip connection plus normalisation.',
    detail:
      'Add the input back to the attention output (the residual), then LayerNorm. Without the skip, gradients vanish in deep stacks; without LayerNorm, training diverges. He, Kaiming 2015 invented residuals; Ba, Kiros, Hinton 2016 wrote LayerNorm.',
    numbers: 'params · 2 d (γ, β)',
  },
  ffn: {
    title: 'Feed-forward (MLP)',
    summary: 'Per-position non-linearity. d → 4d → d.',
    detail:
      'Two linear layers with a ReLU between. Applied identically at every position. Without this the whole block would collapse into a single linear map. Roughly two-thirds of a transformer’s parameters live in these layers.',
    numbers: 'params · 8 d²  (4d in, 4d out)',
  },
  'add-norm-2': {
    title: 'Add + LayerNorm',
    summary: 'The second residual, after the FFN.',
    detail:
      'Same as the first add+norm but on the FFN side. Each sublayer (attention, FFN) gets its own skip and its own norm. This is what makes 96-layer stacks (GPT-3) trainable.',
    numbers: 'params · 2 d',
  },
  output: {
    title: 'Output',
    summary: 'The next block’s input. Same shape as the input.',
    detail:
      'A sequence of N vectors of length d, ready to feed the next encoder block. After the last block, the encoder is done; the decoder consumes these via cross-attention.',
    numbers: 'shape · N × d',
  },
  'residual-1': {
    title: 'Residual · skip 1',
    summary: 'Adds the pre-attention vector back to the attention output.',
    detail:
      'A copy of the block’s input bypasses the attention layer and gets added back in. This is the “highway” for gradients. Without it, the attention layer would have to perfectly preserve information; with it, it only has to refine.',
    numbers: 'params · 0',
  },
  'residual-2': {
    title: 'Residual · skip 2',
    summary: 'Adds the post-norm vector back around the FFN.',
    detail:
      'Same idea, around the feed-forward. Stacking many blocks works only because each one is a small refinement on top of the residual stream, not a full rewrite.',
    numbers: 'params · 0',
  },
}

interface LeftProps {
  state: BlockState
  onChange: (next: BlockState) => void
}

export function LeftPane({ state, onChange }: LeftProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const setSelected = useCallback((id: SubId) => onChange({ selected: id }), [onChange])

  useKeyNudge(
    svgRef,
    useCallback(
      (dx: number, dy: number) => {
        const step = -Math.sign(dy) || Math.sign(dx)
        if (step === 0) return
        const i = ORDER.indexOf(state.selected)
        const n = ORDER.length
        const j = ((i + step) % n + n) % n
        setSelected(ORDER[j])
      },
      [state.selected, setSelected],
    ),
  )

  const narration = `${INFO[state.selected].title}. ${INFO[state.selected].summary}`

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration} priority="normal" />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`One transformer block diagram. ${narration}`}
        tabIndex={0}
      >
        {/* Header */}
        <text
          x={VIEW_W / 2}
          y={36}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          ONE ENCODER BLOCK · &times; N STACKED
        </text>

        {/* Block frame */}
        <rect
          x={CX - 150}
          y={56}
          width={300}
          height={394}
          rx={8}
          fill="none"
          stroke="var(--color-graph-fade)"
          strokeWidth={1}
          strokeDasharray="3 4"
        />

        {/* Vertical spine arrows */}
        {[
          [CX, 410, CX, 376], // in → attn
          [CX, 332, CX, 296], // attn → addnorm1
          [CX, 268, CX, 236], // addnorm1 → ffn
          [CX, 192, CX, 156], // ffn → addnorm2
          [CX, 128, CX, 102], // addnorm2 → out
        ].map(([x1, y1, x2, y2], i) => (
          <g key={i}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="var(--color-graph-ink)"
              strokeOpacity={0.5}
              strokeWidth={1}
            />
            <polygon
              points={`${x2 - 4},${y2 + 4} ${x2 + 4},${y2 + 4} ${x2},${y2 - 2}`}
              fill="var(--color-graph-ink)"
              opacity={0.6}
            />
          </g>
        ))}

        {/* Residual arcs */}
        {[
          { key: 'res1', y0: 410, y1: 300, sub: 'residual-1' as const },
          { key: 'res2', y0: 268, y1: 160, sub: 'residual-2' as const },
        ].map((arc) => {
          const active = state.selected === arc.sub
          return (
            <g
              key={arc.key}
              onClick={() => setSelected(arc.sub)}
              tabIndex={0}
              role="button"
              aria-label={`Residual ${arc.key}. ${active ? 'Selected.' : 'Click to inspect.'}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelected(arc.sub)
                }
              }}
              style={{ cursor: 'pointer' }}
              className="focus-visible:outline-none [&:focus-visible_path]:stroke-vermilion-deep"
            >
              <path
                d={`M ${CX + 50} ${arc.y0} C ${CX + 140} ${arc.y0}, ${CX + 140} ${arc.y1}, ${CX + 50} ${arc.y1}`}
                fill="none"
                stroke="var(--color-vermilion)"
                strokeOpacity={active ? 0.95 : 0.5}
                strokeWidth={active ? 2.4 : 1.2}
                strokeDasharray={active ? undefined : '4 3'}
              />
              <text
                x={CX + 140}
                y={(arc.y0 + arc.y1) / 2 + 4}
                textAnchor="end"
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="11"
                fill={active ? 'var(--color-vermilion)' : 'var(--color-dim)'}
              >
                residual
              </text>
            </g>
          )
        })}

        {/* Sub-blocks */}
        {SUBS.filter((s) => s.kind === 'box').map((s) => {
          const active = state.selected === s.id
          const isIO = s.id === 'input' || s.id === 'output'
          return (
            <g
              key={s.id}
              tabIndex={0}
              role="button"
              aria-label={`${INFO[s.id].title}. ${active ? 'Selected.' : 'Click to inspect.'}`}
              onClick={() => setSelected(s.id)}
              onFocus={() => setSelected(s.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelected(s.id)
                }
              }}
              style={{ cursor: 'pointer' }}
              className="focus-visible:outline-none [&:focus-visible_rect]:stroke-vermilion-deep"
            >
              <rect
                x={s.x}
                y={s.y}
                width={s.w}
                height={s.h}
                rx={4}
                fill={active ? 'var(--color-vermilion)' : 'var(--color-cream)'}
                stroke="var(--color-vermilion)"
                strokeWidth={active ? 2 : 1.2}
                strokeDasharray={isIO ? '4 3' : undefined}
              />
              <text
                x={s.x + s.w / 2}
                y={s.y + s.h / 2 + 5}
                textAnchor="middle"
                fontFamily="Source Serif 4, Georgia, serif"
                fontStyle="italic"
                fontSize="14"
                fill={active ? 'var(--color-cream)' : 'var(--color-ink)'}
              >
                {s.label}
              </text>
            </g>
          )
        })}

        {/* Footer */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 14}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          TAP A SUB-BLOCK · ARROWS STEP
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5a &mdash; The block, in six pieces
      </figcaption>
    </figure>
  )
}

export function RightPane({ state }: { state: BlockState }) {
  const info = INFO[state.selected]
  const narration = `${info.title}. ${info.summary} ${info.detail}`

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration} priority="normal" />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={narration}
      >
        {/* Frame */}
        <rect
          x={56}
          y={56}
          width={VIEW_W - 112}
          height={VIEW_H - 112}
          fill="none"
          stroke="var(--color-graph-fade)"
          strokeWidth={1}
        />

        <text
          x={VIEW_W / 2}
          y={92}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          THE HIGHLIGHTED SUB-BLOCK
        </text>

        <text
          x={VIEW_W / 2}
          y={140}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="22"
          fontWeight="600"
          fill="var(--color-vermilion)"
        >
          {info.title}
        </text>

        <line
          x1={VIEW_W / 2 - 40}
          y1={164}
          x2={VIEW_W / 2 + 40}
          y2={164}
          stroke="var(--color-vermilion)"
          strokeWidth={1}
          opacity={0.6}
        />

        <text
          x={VIEW_W / 2}
          y={202}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="15"
          fill="var(--color-ink)"
        >
          {info.summary}
        </text>

        {/* Detail — wrapped */}
        {wrap(info.detail, 46).map((line, i) => (
          <text
            key={i}
            x={VIEW_W / 2}
            y={252 + i * 22}
            textAnchor="middle"
            fontFamily="Source Serif 4, Georgia, serif"
            fontSize="13"
            fill="var(--color-dim)"
          >
            {line}
          </text>
        ))}

        {/* Numbers */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 90}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="11"
          fill="var(--color-vermilion)"
        >
          {info.numbers}
        </text>
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 64}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          (rough parameter count · d = d
          <tspan baselineShift="sub" fontSize="9">model</tspan>)
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 5b &mdash; What this piece does
      </figcaption>
    </figure>
  )
}

function wrap(text: string, max: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) {
      if (cur) lines.push(cur)
      cur = w
    } else {
      cur = (cur + ' ' + w).trim()
    }
  }
  if (cur) lines.push(cur)
  return lines.slice(0, 9)
}
