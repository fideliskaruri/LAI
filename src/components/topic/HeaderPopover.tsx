import { useEffect, useRef, type ReactNode } from 'react'

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
}

/**
 * Small dropdown popover anchored under the `⋯` overflow button in the
 * topic-page header (PLAN §5.8).
 *
 * Closes when the user clicks outside, presses Escape, or activates an item.
 * Below the 900px breakpoint it renders as a bottom-sheet (full-width, anchored
 * to the bottom of the screen) per PLAN §11.2.
 *
 * v1 deliberately does NOT trap focus — it only auto-focuses the first item on
 * open. Trap-focus + roving tabindex is a Phase 7 polish task.
 */
export function HeaderPopover({ open, onClose, items }: HeaderPopoverProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const firstItemRef = useRef<HTMLButtonElement | null>(null)

  // Outside-click + Escape. Bound only while open to avoid the listener churn
  // of an always-on document-level handler.
  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const root = rootRef.current
      if (!root) return
      const target = event.target as Node | null
      if (target && !root.contains(target)) {
        onClose()
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
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
  }, [open, onClose])

  // Auto-focus the first item when the popover opens. We do this in a separate
  // effect so it only fires on the open transition, not on every items update.
  useEffect(() => {
    if (!open) return
    // Defer one frame so the element is mounted and focusable.
    const id = window.requestAnimationFrame(() => {
      firstItemRef.current?.focus()
    })
    return () => window.cancelAnimationFrame(id)
  }, [open])

  if (!open) return null

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
        {items.map((item, i) => (
          <li key={i}>
            <button
              ref={i === 0 ? firstItemRef : undefined}
              type="button"
              role="menuitem"
              onClick={() => {
                item.onClick()
                onClose()
              }}
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
        ))}
      </ul>
    </div>
  )
}
