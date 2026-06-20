import type { ReactNode } from 'react'

interface ActProps {
  /** DOM id used as the URL hash anchor */
  id: string
  /** Optional eyebrow label (e.g. "Two · Stevin · 1586") */
  eyebrow?: string
  children: ReactNode
}

/**
 * Wraps a prose section with the act's anchor + eyebrow.
 * The id is what useActState observes and useUrlHash deep-links to.
 */
export function Act({ id, eyebrow, children }: ActProps) {
  return (
    <section
      id={id}
      // PLAN §8: act-to-act gap 96px. scroll-mt accounts for the fixed header.
      className="mb-24 first:mt-0 scroll-mt-[14vh]"
    >
      {eyebrow && (
        <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-vermilion mb-3">
          {eyebrow}
        </p>
      )}
      <div
        className="font-serif text-[19px] leading-[1.7] text-ink
                   [&_h1]:font-serif [&_h1]:text-[28px] [&_h1]:font-semibold [&_h1]:leading-tight [&_h1]:mb-6 [&_h1]:text-ink
                   [&_h2]:font-serif [&_h2]:text-[22px] [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-ink
                   [&_p]:my-6 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0
                   [&_em]:italic
                   [&_a]:text-vermilion [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-4 [&_a]:transition-colors hover:[&_a]:text-vermilion-deep
                   [&_.katex-display]:my-6"
      >
        {children}
      </div>
    </section>
  )
}
