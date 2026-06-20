import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useActState } from '../../hooks/useActState'
import { useUrlHash } from '../../hooks/useUrlHash'

export interface ActDef {
  id: string
  /** Short label used by aria-label of the act dot */
  label: string
}

interface TopicPageProps {
  topicId: string
  topicName: string
  acts: ActDef[]
  /** Canvas renderer — receives current act id so it can swap geometry */
  canvas: (currentActId: string) => ReactNode
  /** Prose column children: Act-wrapped MDX sections in document order */
  children: ReactNode
}

/**
 * Single-canvas topic page template (PLAN §5.1).
 *
 *   - Left column: sticky canvas, 55vw × 100svh on desktop
 *   - Right column: scrolling prose, ~580px measure
 *   - Below 900px (Phase 7): collapses to single column
 *
 * Owns `currentActId` via useActState (scroll-position math, PLAN §5.4),
 * deep-link hydration via useUrlHash (PLAN §3).
 */
export function TopicPage({ topicId: _topicId, topicName, acts, canvas, children }: TopicPageProps) {
  const actIds = acts.map((a) => a.id)
  const { currentActId, setCurrentActId, revalidate } = useActState({ actIds })
  useUrlHash({ currentActId, actIds, setCurrentActId, revalidate })

  return (
    <div className="min-h-screen">
      {/* Header chrome — fixed, minimal */}
      <header className="fixed top-0 left-0 right-0 z-30 px-6 py-4 flex items-center justify-between pointer-events-none">
        <Link
          to="/"
          className="pointer-events-auto inline-flex items-center gap-3 group"
          aria-label="Back to the constellation"
        >
          <span aria-hidden="true" className="text-vermilion text-[16px] group-hover:-translate-x-0.5 transition-transform">←</span>
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-dim group-hover:text-vermilion transition-colors">
            {topicName}
          </span>
        </Link>
        {/* Overflow placeholder — full popover in Phase 5 */}
        <button
          type="button"
          className="pointer-events-auto font-sans text-[18px] text-dim hover:text-vermilion px-2"
          aria-label="More options"
        >
          ⋯
        </button>
      </header>

      <div className="md:grid md:grid-cols-[55fr_45fr] md:gap-0">
        {/* Sticky canvas column */}
        <div className="md:sticky md:top-0 md:h-[100svh] md:flex md:flex-col md:items-center md:justify-center px-6 md:px-8 py-12 md:py-0">
          <div className="w-full max-w-[640px]">{canvas(currentActId)}</div>
          <ActDots
            acts={acts}
            currentActId={currentActId}
            onSelect={setCurrentActId}
          />
        </div>

        {/* Prose column */}
        <main className="px-6 md:px-12 pt-[14vh] pb-32">
          <div className="max-w-[580px]">{children}</div>
        </main>
      </div>
    </div>
  )
}

interface ActDotsProps {
  acts: ActDef[]
  currentActId: string
  onSelect: (id: string) => void
}

function ActDots({ acts, currentActId, onSelect }: ActDotsProps) {
  return (
    <nav aria-label="Acts" className="flex items-center justify-center gap-3 mt-6">
      {acts.map((a) => {
        const active = a.id === currentActId
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => {
              const el = document.getElementById(a.id)
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              onSelect(a.id)
            }}
            aria-label={a.label}
            aria-current={active ? 'true' : undefined}
            className={`
              w-[9px] h-[9px] rounded-full transition-all duration-150
              ${active ? 'bg-vermilion scale-110' : 'bg-fade hover:bg-dim'}
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion focus-visible:ring-offset-2 focus-visible:ring-offset-cream
            `}
          />
        )
      })}
    </nav>
  )
}
