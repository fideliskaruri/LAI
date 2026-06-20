import { useState } from 'react'
import { CanvasNarrative } from '../../components/topic/CanvasNarrative'

/**
 * Gibbs resolution: two side-by-side columns showing the same physics
 * written in Tait's quaternion notation and Gibbs's vector notation.
 * Hover any row to highlight the matching row on the other side.
 *
 * The fight resolution: Tait's textbook isn't on your shelf; Gibbs's is.
 */

interface Row {
  id: string
  tait: string
  gibbs: string
  caption: string
}

const rows: Row[] = [
  {
    id: 'gradient',
    tait: 'p = i ∂/∂x + j ∂/∂y + k ∂/∂z',
    gibbs: '∇p   (a vector)',
    caption: 'the gradient',
  },
  {
    id: 'product',
    tait: 'a b = −(a · b) + a × b',
    gibbs: 'a · b   and   a × b   separately',
    caption: 'product of two vectors',
  },
  {
    id: 'addition',
    tait: 'v + w = (a₁ + b₁)i + (a₂ + b₂)j + (a₃ + b₃)k',
    gibbs: 'v + w   componentwise',
    caption: 'addition',
  },
  {
    id: 'rotation',
    tait: 'q v q⁻¹   (a quaternion sandwich)',
    gibbs: 'R · v   (a matrix)',
    caption: 'rotation',
  },
]

export function NotationSplit() {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const hoveredRow = hoveredId ? rows.find((r) => r.id === hoveredId) : null
  const narrationText = hoveredRow
    ? `${hoveredRow.caption}. Tait wrote: ${hoveredRow.tait}. Gibbs wrote: ${hoveredRow.gibbs}.`
    : "Two columns showing the same physics written in Tait's quaternion notation and Gibbs's vector notation. Hover any row to see both."

  return (
    <figure className="w-full">
      <CanvasNarrative text={narrationText} priority="normal" />
      <div className="grid grid-cols-2 gap-4 max-w-[640px] mx-auto px-2 py-4 bg-cream-deep/40 rounded-sm">
        <Column
          title="Tait, 1873"
          subtitle="Quaternions"
          rows={rows}
          side="tait"
          hoveredId={hoveredId}
          onHover={setHoveredId}
        />
        <Column
          title="Gibbs, 1881"
          subtitle="Vector analysis"
          rows={rows}
          side="gibbs"
          hoveredId={hoveredId}
          onHover={setHoveredId}
        />
      </div>
      <figcaption className="font-serif italic text-[13px] text-dim text-center mt-3">
        Fig. 10 — Hover any row to see the translation
      </figcaption>
    </figure>
  )
}

interface ColumnProps {
  title: string
  subtitle: string
  rows: Row[]
  side: 'tait' | 'gibbs'
  hoveredId: string | null
  onHover: (id: string | null) => void
}

function Column({ title, subtitle, rows, side, hoveredId, onHover }: ColumnProps) {
  return (
    <div className="py-3 px-4">
      <p className="font-sans text-[10px] uppercase tracking-[0.22em] text-vermilion mb-1">
        {title}
      </p>
      <p className="font-serif italic text-[12px] text-dim mb-4">{subtitle}</p>
      <ul className="space-y-4">
        {rows.map((r) => {
          const active = hoveredId === r.id
          return (
            <li
              key={r.id}
              onMouseEnter={() => onHover(r.id)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(r.id)}
              onBlur={() => onHover(null)}
              tabIndex={0}
              className={`
                cursor-pointer rounded-sm px-2 py-1 transition-colors
                ${active ? 'bg-vermilion/12' : 'hover:bg-vermilion/6'}
                focus:outline-none focus-visible:ring-2 focus-visible:ring-vermilion
              `}
            >
              <p className="font-serif text-[14px] text-ink leading-snug">
                {side === 'tait' ? r.tait : r.gibbs}
              </p>
              <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-dim mt-1">
                {r.caption}
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
