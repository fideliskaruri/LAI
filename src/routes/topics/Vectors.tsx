// Placeholder — full topic page comes in Phase 1 (vertical slice)
// and Phase 2 (remaining acts).
import { Link } from 'react-router-dom'

export function Vectors() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-[520px]">
        <Link
          to="/"
          className="font-sans text-[11px] uppercase tracking-[0.22em] text-dim hover:text-vermilion"
        >
          ← back
        </Link>
        <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-dim mt-12 mb-3">
          Chapter 01
        </p>
        <h1 className="font-serif text-[28px] text-ink mb-6">Vectors</h1>
        <p className="font-serif italic text-[14px] text-fade">
          Topic page shell — Phase 1 deliverable.
        </p>
      </div>
    </main>
  )
}
