import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dueCount } from './recallStorage'

/**
 * Tiny "↻ N due" link for the constellation hub.
 *
 * Reads localStorage exactly once on mount (matching the spec — "useState +
 * useEffect reading localStorage on mount"). No polling, no blinking, no
 * pulsing — the hub should not nag.
 *
 * Renders nothing when zero cards are due, so it costs no visual real estate
 * in the common case (no cards reviewed yet).
 */
export function DueIndicator() {
  const [n, setN] = useState(0)

  useEffect(() => {
    setN(dueCount())
  }, [])

  if (n <= 0) return null

  return (
    <Link
      to="/recall"
      style={{
        fontFamily: 'var(--font-serif)',
        fontStyle: 'italic',
        fontSize: '13px',
        color: 'var(--color-vermilion)',
        textDecoration: 'underline',
        textDecorationThickness: '1px',
        textUnderlineOffset: '4px',
      }}
    >
      ↻ {n} due
    </Link>
  )
}
