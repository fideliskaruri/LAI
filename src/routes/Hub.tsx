// Placeholder — full constellation comes in Phase 6.
export function Hub() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-[520px]">
        <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-dim mb-6">
          An interactive book
        </p>
        <p className="font-serif italic text-[18px] text-ink leading-relaxed">
          A constellation of playgrounds for the math behind machines that learn.
        </p>
        <p className="font-serif italic text-[14px] text-fade mt-10">
          Constellation hub — Phase 6 deliverable.{' '}
          <a
            href="/vectors"
            className="text-vermilion underline decoration-1 underline-offset-4"
          >
            → Vectors
          </a>
          {' · '}
          <a
            href="/__test-mdx"
            className="text-fade underline decoration-1 underline-offset-4"
          >
            MDX smoke
          </a>
        </p>
      </div>
    </main>
  )
}
