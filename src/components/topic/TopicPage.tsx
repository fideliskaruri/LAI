import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useActState } from '../../hooks/useActState'
import { useUrlHash } from '../../hooks/useUrlHash'
import { HeaderPopover } from './HeaderPopover'

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

// Static for M1 — the platform ships with a 26-topic curriculum (PLAN §1).
// Vectors is chapter 1. When more topics ship, derive these from constellation
// order instead of hardcoding.
const CHAPTER_NUMBER = 1
const CHAPTER_TOTAL = 26

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

  const currentActIndex = Math.max(0, acts.findIndex((a) => a.id === currentActId))
  const currentActNumber = currentActIndex + 1

  // Overflow popover (PLAN §5.8) — local UI state only.
  const [popoverOpen, setPopoverOpen] = useState(false)
  // Toast for the Share action (PLAN §5.10). Held as state so the user gets
  // a visible "Link copied" pip near the anchor.
  const [shareToastVisible, setShareToastVisible] = useState(false)
  const shareToastTimer = useRef<number | null>(null)
  // Reduced-motion override — local to the session per spec; resets on reload.
  // We track this in React state so the popover item label can flip.
  const [reducedMotionOverride, setReducedMotionOverride] = useState(false)

  useEffect(() => {
    return () => {
      if (shareToastTimer.current !== null) {
        window.clearTimeout(shareToastTimer.current)
      }
    }
  }, [])

  function handleShare() {
    // Best-effort clipboard write. We don't await the promise — the toast is
    // optimistic; if the write fails the URL is still in the address bar.
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(window.location.href).catch(() => {})
    }
    setShareToastVisible(true)
    if (shareToastTimer.current !== null) {
      window.clearTimeout(shareToastTimer.current)
    }
    shareToastTimer.current = window.setTimeout(() => {
      setShareToastVisible(false)
      shareToastTimer.current = null
    }, 1500)
  }

  function handleToggleReducedMotion() {
    const next = !reducedMotionOverride
    setReducedMotionOverride(next)
    if (next) {
      document.documentElement.setAttribute('data-reduced-motion', 'true')
    } else {
      document.documentElement.removeAttribute('data-reduced-motion')
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header chrome — fixed, minimal.
          Three slots: back-link (left), chapter/topic block (centered absolutely),
          overflow (right). The centered block is positioned absolutely so it
          doesn't push the side slots out of alignment. */}
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

        {/* Centered chapter title block */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none"
          aria-hidden="false"
        >
          <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-dim">
            Chapter {CHAPTER_NUMBER} of {CHAPTER_TOTAL}
          </div>
          <div className="font-serif text-[16px] font-semibold text-ink leading-tight mt-0.5">
            {topicName}
          </div>
        </div>

        {/* Overflow — popover (PLAN §5.8). Anchored via the relative wrapper
            on desktop; the popover itself drops to a bottom-sheet below 900px. */}
        <div className="relative pointer-events-auto">
          <button
            type="button"
            className="font-sans text-[18px] text-dim hover:text-vermilion px-2"
            aria-label="More options"
            aria-haspopup="menu"
            aria-expanded={popoverOpen}
            onClick={() => setPopoverOpen((v) => !v)}
          >
            ⋯
          </button>
          <HeaderPopover
            open={popoverOpen}
            onClose={() => setPopoverOpen(false)}
            items={[
              {
                icon: '↗',
                label: 'Share',
                onClick: handleShare,
              },
              {
                icon: '⏯',
                label: reducedMotionOverride
                  ? 'Reduced motion: ON'
                  : 'Reduced motion: OFF',
                onClick: handleToggleReducedMotion,
              },
            ]}
          />
          {/* Transient "Link copied" toast (PLAN §5.10). Lives near the anchor,
              fades after 1500ms. pointer-events-none so it never blocks the
              underlying overflow button. */}
          {shareToastVisible && (
            <div
              role="status"
              aria-live="polite"
              className="absolute right-0 top-full mt-2 z-40 pointer-events-none bg-ink text-cream font-sans text-[12px] tracking-[0.02em] px-3 py-1.5 rounded-sm shadow-md whitespace-nowrap"
            >
              Link copied
            </div>
          )}
        </div>
      </header>

      <div className="md:grid md:grid-cols-[55fr_45fr] md:gap-0">
        {/* Sticky canvas column */}
        <div className="md:sticky md:top-0 md:h-[100svh] md:flex md:flex-col md:items-center md:justify-center px-6 md:px-8 py-12 md:py-0">
          <div className="w-full max-w-[640px]">{canvas(currentActId)}</div>

          {/* Act position label — above the dots, updates on scroll */}
          <div
            className="font-sans text-[11px] uppercase tracking-[0.22em] text-dim mt-6 text-center"
            aria-live="polite"
          >
            Act {currentActNumber} of {acts.length}
          </div>

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
  const lastIndex = acts.length - 1
  return (
    <nav aria-label="Acts" className="flex items-center justify-center gap-3 mt-2">
      {acts.map((a, i) => {
        const active = a.id === currentActId
        // Clamp tooltip alignment at the edges so it doesn't get clipped:
        // first dot anchors left, last dot anchors right, middles center.
        const isFirst = i === 0
        const isLast = i === lastIndex
        const tooltipPosition = isFirst
          ? 'left-0'
          : isLast
            ? 'right-0'
            : 'left-1/2 -translate-x-1/2'

        return (
          <span key={a.id} className="relative inline-flex group">
            <button
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
            {/* Tooltip — visible on hover or keyboard focus of the dot.
                Positioned above the dots row; pointer-events-none so it never
                blocks subsequent hovers. */}
            <span
              role="tooltip"
              className={`
                pointer-events-none absolute bottom-full mb-2 ${tooltipPosition}
                whitespace-nowrap rounded-sm bg-ink/95 text-cream
                px-2 py-1 font-sans text-[11px] tracking-[0.04em]
                opacity-0 translate-y-1 transition-all duration-150
                group-hover:opacity-100 group-hover:translate-y-0
                group-focus-within:opacity-100 group-focus-within:translate-y-0
              `}
            >
              {a.label}
            </span>
          </span>
        )
      })}
    </nav>
  )
}
