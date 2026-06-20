import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from 'react'

export interface HeaderPopoverItem {
  /** Leading glyph or icon node. Strings render as a span so they inherit type styles. */
  icon: ReactNode | string
  label: string
  onClick: () => void
}

interface HeaderPopoverProps {
  open: boolean
  onClose: () => void
  items: HeaderPopoverItem[]
  /**
   * Ref to the `⋯` trigger button. Used to restore focus when the popover
   * closes via Escape, outside click, or item activation. Optional so legacy
   * callers still work, but strongly recommended for keyboard a11y.
   */
  triggerRef?: RefObject<HTMLElement | null>
}

/**
 * Small dropdown popover anchored under the `⋯` overflow button in the
 * topic-page header (PLAN §5.8).
 *
 * Implements the WAI-ARIA menu pattern:
 *   - role="menu" + role="menuitem"
 *   - Roving tabindex (only the active item is tabbable)
 *   - ArrowDown / ArrowUp traverse with wrap
 *   - Home / End jump to first / last
 *   - Enter / Space activate the current item
 *   - Tab / Shift+Tab cycle within the menu (focus trap)
 *   - Escape closes and restores focus to the trigger
 *   - Outside click / pointer-down closes and restores focus to the trigger
 *
 * Below the 900px breakpoint it renders as a bottom-sheet (full-width,
 * anchored to the bottom of the screen) per PLAN §11.2.
 */
export function HeaderPopover({ open, onClose, items, triggerRef }: HeaderPopoverProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])
  // Element to restore focus to when the popover closes. We capture this on
  // the open transition so we work even when the caller doesn't pass a
  // triggerRef (we fall back to whatever was focused at the moment of open).
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  // The "current" item per the roving-tabindex pattern. Reset to 0 each time
  // the popover opens so the first item is always the initial landing target.
  const [activeIndex, setActiveIndex] = useState(0)

  // Keep the refs array in sync with the items length. We avoid leaking stale
  // refs to detached buttons after a re-render with fewer items.
  if (itemRefs.current.length !== items.length) {
    itemRefs.current = Array(items.length).fill(null)
  }

  // Close + restore focus. Used by Escape, outside click, and item activation.
  const closeAndRestore = useCallback(() => {
    onClose()
    // Defer the restore so it happens after React unmounts the popover; if we
    // focus synchronously the browser may bounce focus back to body when the
    // current focus owner unmounts.
    const target = restoreFocusRef.current
    if (target) {
      window.requestAnimationFrame(() => {
        target.focus()
      })
    }
  }, [onClose])

  // Capture the previously-focused element + reset the roving index every
  // time the popover transitions to open.
  useEffect(() => {
    if (!open) return
    const fromProp = triggerRef?.current ?? null
    const fromDocument =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    restoreFocusRef.current = fromProp ?? fromDocument
    setActiveIndex(0)
  }, [open, triggerRef])

  // Outside-click + Escape. Bound only while open to avoid the listener churn
  // of an always-on document-level handler.
  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const root = rootRef.current
      if (!root) return
      const target = event.target as Node | null
      // Don't treat clicks on the trigger as outside — the trigger's own
      // onClick will toggle the popover. Restoring focus here would also race
      // with the trigger handler.
      const trigger = triggerRef?.current ?? null
      if (target && trigger && trigger.contains(target)) return
      if (target && !root.contains(target)) {
        closeAndRestore()
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        closeAndRestore()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, closeAndRestore, triggerRef])

  // Focus the active item after each open / activeIndex change. Deferred a
  // frame so the element is mounted and focusable.
  useEffect(() => {
    if (!open) return
    const id = window.requestAnimationFrame(() => {
      itemRefs.current[activeIndex]?.focus()
    })
    return () => window.cancelAnimationFrame(id)
  }, [open, activeIndex])

  if (!open) return null

  const lastIndex = items.length - 1

  function activate(i: number) {
    const item = items[i]
    if (!item) return
    item.onClick()
    closeAndRestore()
  }

  function handleItemKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, i: number) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActiveIndex(i === lastIndex ? 0 : i + 1)
        break
      case 'ArrowUp':
        event.preventDefault()
        setActiveIndex(i === 0 ? lastIndex : i - 1)
        break
      case 'Home':
        event.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        event.preventDefault()
        setActiveIndex(lastIndex)
        break
      case 'Tab':
        // Trap focus inside the menu. Tab from last → first; Shift+Tab from
        // first → last. Per the WAI-ARIA menu spec, Tab should not move
        // focus out of an open menu.
        event.preventDefault()
        if (event.shiftKey) {
          setActiveIndex(i === 0 ? lastIndex : i - 1)
        } else {
          setActiveIndex(i === lastIndex ? 0 : i + 1)
        }
        break
      case 'Enter':
      case ' ':
        // Space is normally the button default activation key, but we
        // intercept so the activation also closes + restores focus through
        // our shared path.
        event.preventDefault()
        activate(i)
        break
      default:
        break
    }
  }

  return (
    <div
      ref={rootRef}
      role="menu"
      aria-orientation="vertical"
      className={[
        // Mobile: bottom-sheet, full width, anchored to bottom.
        'fixed inset-x-0 bottom-0 z-40',
        'border-t border-graph-fade',
        'bg-cream shadow-md',
        'py-2',
        // Desktop (>=900px): small dropdown anchored under the ⋯ button.
        // The button lives in a `pointer-events-none` header; the popover
        // re-enables interaction explicitly.
        'pointer-events-auto',
        'md:absolute md:inset-x-auto md:bottom-auto',
        'md:right-4 md:top-full md:mt-2',
        'md:w-[240px]',
        'md:border md:border-graph-fade',
        'md:rounded-sm',
      ].join(' ')}
    >
      <ul className="flex flex-col">
        {items.map((item, i) => {
          const isActive = i === activeIndex
          return (
            <li key={i}>
              <button
                ref={(el) => {
                  itemRefs.current[i] = el
                }}
                type="button"
                role="menuitem"
                // Roving tabindex: only the active item participates in the
                // page tab sequence. The rest are reachable via arrow keys.
                tabIndex={isActive ? 0 : -1}
                onClick={() => activate(i)}
                onKeyDown={(e) => handleItemKeyDown(e, i)}
                onMouseEnter={() => setActiveIndex(i)}
                className={[
                  'w-full text-left',
                  'flex items-center gap-2',
                  'px-4 py-2',
                  'font-sans text-[13px] text-ink',
                  'hover:bg-cream-deep focus-visible:bg-cream-deep',
                  'focus-visible:outline-none',
                ].join(' ')}
              >
                <span
                  aria-hidden="true"
                  className="inline-flex w-4 justify-center text-[14px] text-dim"
                >
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
