import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-[480px]">
        <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-vermilion mb-8">
          404
        </p>
        <p className="font-serif text-[22px] text-ink mb-10 leading-relaxed">
          We don't have a topic at that URL yet.
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
