import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useActState } from '../../hooks/useActState'
import { useUrlHash } from '../../hooks/useUrlHash'
import { useScrollLock } from '../../hooks/useScrollLock'
import { HeaderPopover } from './HeaderPopover'

/**
 * Split-canvas topic template (PLAN §5.2).
 *
 * Two canvases sharing the same currentActId. Each pane has its own state.
 * Sync mode determines how a change in one pane propagates (or doesn't) to
 * the other:
 *
 *   - 'independent'        : panes don't talk
 *   - 'left-drives-right'  : left change derives right state (deriveRight)
 *   - 'right-drives-left'  : right change derives left state (deriveLeft)
 *   - 'co-mutating'        : both panes share a single state object;
 *                            change from either side replaces both
 *
 * Layout: desktop side-by-side (each ~27vw within the 55vw canvas column),
 * mobile stacks the two canvases above the prose.
 */

export type SyncMode = 'independent' | 'left-drives-right' | 'right-drives-left' | 'co-mutating'

export interface SplitActDef<L = unknown, R = unknown> {
  id: string
  label: string
  syncMode: SyncMode
  initialLeft: L
  initialRight: R
  /** Used only when syncMode === 'left-drives-right' */
  deriveRight?: (left: L) => R
  /** Used only when syncMode === 'right-drives-left' */
  deriveLeft?: (right: R) => L
}

export interface SplitCanvasRenderProps {
  state: unknown
  onChange: (next: unknown) => void
  currentActId: string
}

interface TopicPageSplitProps {
  topicId: string
  topicName: string
  acts: SplitActDef[]
  leftCanvas: (props: SplitCanvasRenderProps) => ReactNode
  rightCanvas: (props: SplitCanvasRenderProps) => ReactNode
  children: ReactNode
}

export function TopicPageSplit({
  topicId: _topicId,
  topicName,
  acts,
  leftCanvas,
  rightCanvas,
  children,
}: TopicPageSplitProps) {
  const actIds = acts.map((a) => a.id)
  const { currentActId, setCurrentActId, revalidate } = useActState({ actIds })
  useUrlHash({ currentActId, actIds, setCurrentActId, revalidate })

  // actStateMap: Map<actId, { left, right }>
  const initialMap = useMemo(() => {
    const m = new Map<string, { left: unknown; right: unknown }>()
    for (const a of acts) {
      m.set(a.id, { left: a.initialLeft, right: a.initialRight })
    }
    return m
  }, [acts])
  const [stateMap, setStateMap] = useState(initialMap)

  const currentAct = acts.find((a) => a.id === currentActId) ?? acts[0]
  const currentState = stateMap.get(currentAct.id) ?? {
    left: currentAct.initialLeft,
    right: currentAct.initialRight,
  }

  const dispatch = (side: 'left' | 'right', next: unknown) => {
    setStateMap((prev) => {
      const map = new Map(prev)
      const cur = map.get(currentAct.id) ?? {
        left: currentAct.initialLeft,
        right: currentAct.initialRight,
      }
      const updated = { ...cur }

      if (side === 'left') {
        updated.left = next
        if (currentAct.syncMode === 'left-drives-right' && currentAct.deriveRight) {
          updated.right = currentAct.deriveRight(next)
        } else if (currentAct.syncMode === 'co-mutating') {
          updated.right = next
        }
      } else {
        updated.right = next
        if (currentAct.syncMode === 'right-drives-left' && currentAct.deriveLeft) {
          updated.left = currentAct.deriveLeft(next)
        } else if (currentAct.syncMode === 'co-mutating') {
          updated.left = next
        }
      }

      map.set(currentAct.id, updated)
      return map
    })
  }

  const [fullscreen, setFullscreen] = useState(false)
  const expandTriggerRef = useRef<HTMLButtonElement | null>(null)
  const exitButtonRef = useRef<HTMLButtonElement | null>(null)

  // iOS-safe body scroll lock that preserves and restores scroll position.
  useScrollLock(fullscreen)

  useEffect(() => {
    if (!fullscreen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', handler)
    // Focus the exit button so Escape and Tab work predictably.
    exitButtonRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', handler)
      // Return focus to the trigger that opened the overlay.
      expandTriggerRef.current?.focus()
    }
  }, [fullscreen])

  // Overflow popover (PLAN §5.8) — local UI state only. Mirrors TopicPage.
  const [popoverOpen, setPopoverOpen] = useState(false)
  const popoverTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [shareToastVisible, setShareToastVisible] = useState(false)
  const shareToastTimer = useRef<number | null>(null)
  // Reduced-motion override — persists for the session on the <html> element.
  // Lazy initializer keeps the toggle's label in sync with the live DOM state
  // across navigations.
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

  const renderActDots = (mt: string) => (
    <nav aria-label="Acts" className={`flex items-center justify-center gap-3 ${mt}`}>
      {acts.map((a) => {
        const active = a.id === currentActId
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => {
              if (!fullscreen) {
                const el = document.getElementById(a.id)
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
              setCurrentActId(a.id)
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

  return (
    <div className="min-h-screen">
      {/* Page tree wrapper. While the fullscreen dialog is open, `inert`
          disables focus, click, and AT semantics for everything behind it,
          honoring the aria-modal contract. The dialog overlay is rendered
          OUTSIDE this wrapper. */}
      <div
        {...({ inert: fullscreen ? '' : undefined } as Record<string, unknown>)}
        aria-hidden={fullscreen || undefined}
      >
      <header className="fixed top-0 left-0 right-0 z-30 px-6 py-4 flex items-center justify-between pointer-events-none">
        <Link to="/" className="pointer-events-auto inline-flex items-center gap-3 group">
          <span aria-hidden="true" className="text-vermilion text-[16px] group-hover:-translate-x-0.5 transition-transform">
            ←
          </span>
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-dim group-hover:text-vermilion transition-colors">
            {topicName}
          </span>
        </Link>
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

      <div className="lg:grid lg:grid-cols-[62fr_38fr] lg:gap-0">
        <div className="relative lg:sticky lg:top-0 lg:h-[100svh] lg:flex lg:flex-col lg:items-center lg:justify-center px-4 lg:px-6 py-12 lg:py-0">
          {/* Expand-to-fullscreen affordance. Sits inside the canvas column so
              it follows the sticky region; vermilion on hover, dim at rest. */}
          <button
            ref={expandTriggerRef}
            type="button"
            onClick={() => setFullscreen(true)}
            aria-label="Expand canvases to fullscreen"
            className="absolute top-4 right-4 z-10 inline-flex items-center justify-center w-9 h-9 rounded-sm text-dim hover:text-vermilion hover:bg-cream-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vermilion"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 7 3 3 7 3" />
              <polyline points="15 7 15 3 11 3" />
              <polyline points="3 11 3 15 7 15" />
              <polyline points="15 11 15 15 11 15" />
            </svg>
          </button>
          {/* Inline canvases. Unmount when fullscreen is open so we don't
              double-mount WebGL contexts (Chrome caps at 16). Placeholder
              preserves sticky-column dimensions while the overlay is up. */}
          {fullscreen ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-[920px]"
              aria-hidden="true"
            >
              <div className="min-w-0 aspect-[5/4]" />
              <div className="min-w-0 aspect-[5/4]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-[920px]">
              <div className="min-w-0">
                {leftCanvas({
                  state: currentState.left,
                  onChange: (next) => dispatch('left', next),
                  currentActId,
                })}
              </div>
              <div className="min-w-0">
                {rightCanvas({
                  state: currentState.right,
                  onChange: (next) => dispatch('right', next),
                  currentActId,
                })}
              </div>
            </div>
          )}
          {renderActDots('mt-6')}
        </div>

        <main className="px-6 lg:px-12 pt-[14vh] pb-32">
          <div className="max-w-[580px]">{children}</div>
        </main>
      </div>
      </div>

      {fullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Expanded canvases · ${topicName} · ${currentAct.label}`}
          className="fixed inset-0 z-50 bg-cream flex flex-col"
        >
          <header className="flex items-center justify-between px-6 py-4 border-b border-graph-fade">
            <div className="font-sans text-[11px] uppercase tracking-[0.22em] text-dim">
              {topicName} · {currentAct.label}
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
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-8 px-8 py-6 items-center overflow-auto">
            <div className="min-w-0 w-full max-w-[900px] mx-auto">
              {leftCanvas({
                state: currentState.left,
                onChange: (next) => dispatch('left', next),
                currentActId,
              })}
            </div>
            <div className="min-w-0 w-full max-w-[900px] mx-auto">
              {rightCanvas({
                state: currentState.right,
                onChange: (next) => dispatch('right', next),
                currentActId,
              })}
            </div>
          </div>
          <div className="pb-6">{renderActDots('mt-0')}</div>
        </div>
      )}
    </div>
  )
}
