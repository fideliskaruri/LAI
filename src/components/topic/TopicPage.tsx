import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useActState } from '../../hooks/useActState'
import { useUrlHash } from '../../hooks/useUrlHash'
import { useScrollLock } from '../../hooks/useScrollLock'
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
  // Fullscreen overlay state. Declared first so we can pause useActState's
  // scroll listener while the body-scroll lock is active — otherwise the
  // position:fixed layout reflow snaps the scroll cursor to 0 and overwrites
  // the user's manual act selection in the overlay.
  const [fullscreen, setFullscreen] = useState(false)
  const expandTriggerRef = useRef<HTMLButtonElement | null>(null)
  const exitButtonRef = useRef<HTMLButtonElement | null>(null)

  const actIds = acts.map((a) => a.id)
  const { currentActId, setCurrentActId, revalidate } = useActState({
    actIds,
    enabled: !fullscreen,
  })
  useUrlHash({ currentActId, actIds, setCurrentActId, revalidate })

  const currentActIndex = Math.max(0, acts.findIndex((a) => a.id === currentActId))
  const currentActNumber = currentActIndex + 1
  const currentAct = acts[currentActIndex]

  // iOS-safe body scroll lock that preserves and restores scroll position.
  // Replaces the naive `body.style.overflow = 'hidden'` which collapses body
  // height on iOS Safari and snaps scrollY to 0 on release.
  useScrollLock(fullscreen)

  useEffect(() => {
    if (!fullscreen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', handler)
    exitButtonRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', handler)
      expandTriggerRef.current?.focus()
    }
  }, [fullscreen])

  // Overflow popover (PLAN §5.8) — local UI state only. We keep a ref to the
  // `⋯` trigger so HeaderPopover can restore focus to it on close (Escape,
  // outside click, item activation) per the WAI-ARIA menu pattern.
  const [popoverOpen, setPopoverOpen] = useState(false)
  const popoverTriggerRef = useRef<HTMLButtonElement | null>(null)
  // Toast for the Share action (PLAN §5.10). Held as state so the user gets
  // a visible "Link copied" pip near the anchor.
  const [shareToastVisible, setShareToastVisible] = useState(false)
  const shareToastTimer = useRef<number | null>(null)
  // Reduced-motion override — persists for the session on the <html> element.
  // Initialize from the DOM (lazy initializer) so navigating away from /vectors
  // and back doesn't desync the toggle's label from the actual data-attr.
  // We intentionally do NOT clear the attribute on unmount: the override is
  // session-scoped, and any new TopicPage mount must reflect the live DOM state.
  const [reducedMotionOverride, setReducedMotionOverride] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false
    return document.documentElement.dataset.reducedMotion === 'true'
  })

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
      {/* Page tree wrapper. While the fullscreen dialog is open, `inert`
          disables focus, click, and AT semantics for everything behind it,
          honoring the aria-modal contract on modern browsers. `aria-hidden`
          mirrors the state as a belt-and-suspenders fallback. The dialog
          overlay itself is rendered OUTSIDE this wrapper. */}
      <div
        {...({ inert: fullscreen ? '' : undefined } as Record<string, unknown>)}
        aria-hidden={fullscreen || undefined}
      >
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
            ref={popoverTriggerRef}
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
            triggerRef={popoverTriggerRef}
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
        <div className="relative md:sticky md:top-0 md:h-[100svh] md:flex md:flex-col md:items-center md:justify-center px-6 md:px-8 py-12 md:py-0">
          <button
            ref={expandTriggerRef}
            type="button"
            onClick={() => setFullscreen(true)}
            aria-label="Expand canvas to fullscreen"
            className="absolute top-[72px] right-4 z-10 inline-flex items-center justify-center w-9 h-9 rounded-sm text-dim hover:text-vermilion hover:bg-cream-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 7 3 3 7 3" />
              <polyline points="15 7 15 3 11 3" />
              <polyline points="3 11 3 15 7 15" />
              <polyline points="15 11 15 15 11 15" />
            </svg>
          </button>
          {/* Inline canvas. Unmount when the fullscreen overlay is open so
              we don't double-mount WebGL contexts (Chrome caps at 16). The
              placeholder preserves the sticky-column dimensions so the act
              dots and sticky math don't shift when fullscreen toggles. */}
          {fullscreen ? (
            <div className="w-full max-w-[640px] aspect-[5/4]" aria-hidden="true" />
          ) : (
            <div className="w-full max-w-[640px]">{canvas(currentActId)}</div>
          )}

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
            suppressScroll={fullscreen}
          />
        </div>

        {/* Prose column */}
        <main className="px-6 md:px-12 pt-[14vh] pb-32">
          <div className="max-w-[580px]">{children}</div>
        </main>
      </div>
      </div>

      {fullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Expanded canvas · ${topicName} · ${currentAct?.label ?? ''}`}
          className="fixed inset-0 z-50 bg-cream flex flex-col"
        >
          <header className="flex items-center justify-between px-6 py-4 border-b border-graph-fade">
            <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-dim">
              {topicName} · {currentAct?.label ?? ''}
            </div>
            <button
              ref={exitButtonRef}
              type="button"
              onClick={() => setFullscreen(false)}
              aria-label="Exit fullscreen (Escape)"
              className="inline-flex items-center gap-2 text-dim hover:text-vermilion focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion rounded-sm px-2 py-1"
            >
              <span className="font-sans text-[11px] uppercase tracking-[0.22em]">Esc</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="3" y1="3" x2="13" y2="13" />
                <line x1="13" y1="3" x2="3" y2="13" />
              </svg>
            </button>
          </header>
          <div className="flex-1 min-h-0 flex items-center justify-center px-8 py-6 overflow-auto">
            <div className="w-full max-w-[1200px]">{canvas(currentActId)}</div>
          </div>
          <nav aria-label="Acts" className="flex items-center justify-center gap-3 pb-6">
            {acts.map((a) => {
              const active = a.id === currentActId
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setCurrentActId(a.id)}
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
        </div>
      )}
    </div>
  )
}

interface ActDotsProps {
  acts: ActDef[]
  currentActId: string
  onSelect: (id: string) => void
  /**
   * While the fullscreen overlay is open we update currentActId (so the
   * fullscreen canvas swaps) but do NOT scroll the prose underneath. On
   * close, useScrollLock restores the original scroll position.
   */
  suppressScroll?: boolean
}

function ActDots({ acts, currentActId, onSelect, suppressScroll = false }: ActDotsProps) {
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
                if (!suppressScroll) {
                  const el = document.getElementById(a.id)
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
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
