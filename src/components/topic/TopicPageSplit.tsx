import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useActState } from '../../hooks/useActState'
import { useUrlHash } from '../../hooks/useUrlHash'

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

  return (
    <div className="min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-30 px-6 py-4 flex items-center justify-between pointer-events-none">
        <Link to="/" className="pointer-events-auto inline-flex items-center gap-3 group">
          <span aria-hidden="true" className="text-vermilion text-[16px] group-hover:-translate-x-0.5 transition-transform">
            ←
          </span>
          <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-dim group-hover:text-vermilion transition-colors">
            {topicName}
          </span>
        </Link>
        <button
          type="button"
          className="pointer-events-auto font-sans text-[18px] text-dim hover:text-vermilion px-2"
          aria-label="More options"
        >
          ⋯
        </button>
      </header>

      <div className="lg:grid lg:grid-cols-[55fr_45fr] lg:gap-0">
        <div className="lg:sticky lg:top-0 lg:h-[100svh] lg:flex lg:flex-col lg:items-center lg:justify-center px-4 lg:px-6 py-12 lg:py-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-[680px]">
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
        </div>

        <main className="px-6 lg:px-12 pt-[14vh] pb-32">
          <div className="max-w-[580px]">{children}</div>
        </main>
      </div>
    </div>
  )
}
