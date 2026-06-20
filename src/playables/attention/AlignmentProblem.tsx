import { useRef, useCallback } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'
import { useKeyNudge } from '../../hooks/useKeyNudge'

/**
 * Act 2 — The alignment problem.
 *
 * Left  : the English source sentence "the cat sat on the mat", stacked.
 * Right : the French translation "le chat s'est assis sur le tapis".
 *         Lines connect each French target to the English source it
 *         attends to. Some are 1-to-1 (chat ↔ cat); some are 1-to-many
 *         ("s'est assis" ↔ "sat").
 *
 * Sync — co-mutating. Hover (or focus) any token on either side and the
 * matching token(s) on the other side light up. The lines between them
 * become solid vermilion; the others stay faint.
 *
 * The question the act poses, and the chapter answers: how do we *learn*
 * this alignment without anyone labelling it?
 */

export interface AlignState {
  hoveredSourceIdx: number | null
  hoveredTargetIdx: number | null
}

export const INITIAL_ALIGN: AlignState = {
  hoveredSourceIdx: null,
  hoveredTargetIdx: null,
}

// Source: English. Target: French. The `links` map encodes which French
// indices attend to which English indices (1-to-many is allowed).
const SOURCE = ['the', 'cat', 'sat', 'on', 'the', 'mat']
const TARGET = ['le', 'chat', "s'est", 'assis', 'sur', 'le', 'tapis']

// targetIdx -> sourceIdx[]
const LINKS: Record<number, number[]> = {
  0: [0], // le ↔ the
  1: [1], // chat ↔ cat
  2: [2], // s'est ↔ sat
  3: [2], // assis ↔ sat
  4: [3], // sur ↔ on
  5: [4], // le ↔ the (second)
  6: [5], // tapis ↔ mat
}

const VIEW_W = 600
const VIEW_H = 480
const ROW_H = 44
const TOP = 96

// Source column on the left, target column on the right.
const SRC_X = 140
const TGT_X = 460

/** Compute the set of highlighted source / target indices given current hover. */
function computeHighlights(state: AlignState): {
  highlightedSources: Set<number>
  highlightedTargets: Set<number>
} {
  const hs = new Set<number>()
  const ht = new Set<number>()
  if (state.hoveredTargetIdx != null) {
    ht.add(state.hoveredTargetIdx)
    for (const s of LINKS[state.hoveredTargetIdx] ?? []) hs.add(s)
  }
  if (state.hoveredSourceIdx != null) {
    hs.add(state.hoveredSourceIdx)
    // Walk the links to find target indices pointing at this source
    for (const [tStr, sList] of Object.entries(LINKS)) {
      if (sList.includes(state.hoveredSourceIdx)) ht.add(Number(tStr))
    }
  }
  return { highlightedSources: hs, highlightedTargets: ht }
}

/** A tidy summary the screen reader gets when something is hovered. */
function narrationFor(state: AlignState): string {
  if (state.hoveredTargetIdx != null) {
    const t = TARGET[state.hoveredTargetIdx]
    const sources = (LINKS[state.hoveredTargetIdx] ?? [])
      .map((i) => SOURCE[i])
      .join(', ')
    return `Target word ${t} aligns to source word${
      (LINKS[state.hoveredTargetIdx] ?? []).length > 1 ? 's' : ''
    } ${sources}.`
  }
  if (state.hoveredSourceIdx != null) {
    const s = SOURCE[state.hoveredSourceIdx]
    const targets: string[] = []
    for (const [tStr, sList] of Object.entries(LINKS)) {
      if (sList.includes(state.hoveredSourceIdx)) targets.push(TARGET[Number(tStr)])
    }
    return `Source word ${s} is translated as ${targets.join(', ')}.`
  }
  return 'English source on the left, French target on the right. Hover any word to see its alignment.'
}

/* ============================================================== */
/* LEFT PANE — the English source                                  */
/* ============================================================== */

interface LeftProps {
  state: AlignState
  onChange: (next: AlignState) => void
}

export function LeftPane({ state, onChange }: LeftProps) {
  const { highlightedSources, highlightedTargets } = computeHighlights(state)
  const narration = narrationFor(state)

  const setSourceHover = useCallback(
    (i: number | null) => onChange({ hoveredSourceIdx: i, hoveredTargetIdx: null }),
    [onChange],
  )

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration} priority="normal" />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`English source words for translation. ${narration}`}
      >
        {/* Title */}
        <text
          x={VIEW_W / 2}
          y={56}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          SOURCE &middot; ENGLISH
        </text>

        {/* Subtitle */}
        <text
          x={VIEW_W / 2}
          y={76}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          the cat sat on the mat
        </text>

        {/* Source tokens */}
        {SOURCE.map((w, i) => {
          const cy = TOP + i * ROW_H
          const active = highlightedSources.has(i)
          return (
            <TokenBox
              key={`src-${i}`}
              x={SRC_X}
              y={cy}
              w={160}
              label={w}
              active={active}
              ariaLabel={`Source word ${w}. ${active ? 'Currently highlighted.' : ''}`}
              onHover={(h) => setSourceHover(h ? i : null)}
            />
          )
        })}

        {/* The lines: each target row connects to its source(s). They get
            drawn pointing rightward off-canvas, completed by the right pane. */}
        {Object.entries(LINKS).map(([tStr, sList]) => {
          const t = Number(tStr)
          const ty = TOP + t * ROW_H
          // On this canvas we exit the right edge at y = ty (roughly).
          return sList.map((s) => {
            const sy = TOP + s * ROW_H
            const active =
              highlightedSources.has(s) && highlightedTargets.has(t)
            const stroke = active
              ? 'var(--color-vermilion)'
              : 'var(--color-graph-ink)'
            const op = active ? 1 : 0.18
            return (
              <path
                key={`l-${s}-${t}`}
                d={`M ${SRC_X + 160} ${sy} Q ${VIEW_W - 10} ${(sy + ty) / 2} ${VIEW_W} ${ty}`}
                fill="none"
                stroke={stroke}
                strokeOpacity={op}
                strokeWidth={active ? 1.8 : 1}
              />
            )
          })
        })}

        {/* Hint */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 28}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          HOVER OR TAB FOR ALIGNMENT
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1a &mdash; the cat sat on the mat
      </figcaption>
    </figure>
  )
}

/* ============================================================== */
/* RIGHT PANE — the French target                                  */
/* ============================================================== */

export function RightPane({ state, onChange }: LeftProps) {
  const { highlightedTargets } = computeHighlights(state)
  const narration = narrationFor(state)

  const setTargetHover = useCallback(
    (i: number | null) => onChange({ hoveredSourceIdx: null, hoveredTargetIdx: i }),
    [onChange],
  )

  return (
    <figure className="w-full">
      <CanvasNarrative text={narration} priority="normal" />
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`French target words for translation. ${narration}`}
      >
        {/* Title */}
        <text
          x={VIEW_W / 2}
          y={56}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="11"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          TARGET &middot; FRENCH
        </text>
        <text
          x={VIEW_W / 2}
          y={76}
          textAnchor="middle"
          fontFamily="Source Serif 4, Georgia, serif"
          fontStyle="italic"
          fontSize="12"
          fill="var(--color-dim)"
        >
          le chat s&apos;est assis sur le tapis
        </text>

        {/* Incoming line stubs (entering from the left). We draw a short
            stub at the same y so the connection from the left pane appears
            seamless to the reader's eye. */}
        {Object.entries(LINKS).map(([tStr]) => {
          const t = Number(tStr)
          const ty = TOP + t * ROW_H
          const active = highlightedTargets.has(t)
          return (
            <line
              key={`stub-${t}`}
              x1={0}
              y1={ty}
              x2={TGT_X - 160}
              y2={ty}
              stroke={active ? 'var(--color-vermilion)' : 'var(--color-graph-ink)'}
              strokeOpacity={active ? 1 : 0.18}
              strokeWidth={active ? 1.8 : 1}
            />
          )
        })}

        {/* Target tokens */}
        {TARGET.map((w, i) => {
          const cy = TOP + i * ROW_H
          const active = highlightedTargets.has(i)
          return (
            <TokenBox
              key={`tgt-${i}`}
              x={TGT_X - 160}
              y={cy}
              w={160}
              label={w}
              active={active}
              ariaLabel={`Target word ${w}. ${active ? 'Currently highlighted.' : ''}`}
              onHover={(h) => setTargetHover(h ? i : null)}
            />
          )
        })}

        {/* Hint */}
        <text
          x={VIEW_W / 2}
          y={VIEW_H - 28}
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontSize="10"
          letterSpacing="0.22em"
          fill="var(--color-dim)"
        >
          ONE-TO-ONE &middot; ONE-TO-MANY
        </text>
      </svg>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-2">
        Fig. 1b &mdash; le chat s&apos;est assis sur le tapis
      </figcaption>
    </figure>
  )
}

/* ============================================================== */
/* Shared token box                                                 */
/* ============================================================== */

interface TokenBoxProps {
  x: number
  y: number
  w: number
  label: string
  active: boolean
  ariaLabel: string
  onHover: (hovering: boolean) => void
}

function TokenBox({ x, y, w, label, active, ariaLabel, onHover }: TokenBoxProps) {
  const ref = useRef<SVGGElement | null>(null)
  useKeyNudge(
    ref,
    useCallback(() => {
      /* hover-only; arrows do nothing here, but the handle is keyboard-focusable. */
    }, []),
  )
  return (
    <g
      ref={ref}
      tabIndex={0}
      role="button"
      aria-label={ariaLabel}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      style={{ cursor: 'pointer' }}
      className="focus-visible:outline-none [&:focus-visible_rect]:stroke-vermilion-deep"
    >
      <rect
        x={x}
        y={y - 16}
        width={w}
        height={32}
        rx={4}
        fill={active ? 'var(--color-vermilion)' : 'var(--color-cream)'}
        stroke="var(--color-vermilion)"
        strokeWidth={active ? 2 : 1.2}
      />
      <text
        x={x + w / 2}
        y={y + 5}
        textAnchor="middle"
        fontFamily="Source Serif 4, Georgia, serif"
        fontStyle="italic"
        fontSize="16"
        fill={active ? 'var(--color-cream)' : 'var(--color-ink)'}
      >
        {label}
      </text>
    </g>
  )
}
