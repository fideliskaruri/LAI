import { Link } from 'react-router-dom'

/**
 * Placeholder /recall route — the proper "due cards listed here" UI is a v2
 * job. Quiet copy in the editorial voice; matches the 404 page's layout so
 * the hub link doesn't dump readers into something jarring.
 */
export function Recall() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-[520px]">
        <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-vermilion mb-8">
          Recall
        </p>
        <p className="font-serif text-[20px] text-ink mb-4 leading-relaxed">
          Due cards listed here in v2.
        </p>
        <p className="font-serif italic text-[15px] text-dim mb-10 leading-relaxed">
          For now, revisit a chapter to meet a sleeping card where you first
          saw it.
        </p>
        <Link
          to="/"
          className="font-serif italic text-[16px] text-vermilion underline decoration-1 underline-offset-4 hover:text-vermilion-deep"
        >
          ↩ Back to the constellation
        </Link>
      </div>
    </main>
  )
}
