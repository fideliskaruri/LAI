// Smoke test for the four-way integration: MDX + KaTeX + embedded components + react-router links.
// Per PLAN §14.10 first-day-of-M1 smoke test.
// If this page renders all four things correctly, we're cleared on day one.
import { MDXProvider } from '@mdx-js/react'
import { Link } from 'react-router-dom'
import Hello from '../../content/__test/hello.mdx'
import { DragHandle } from '../../components/ui/DragHandle'

const components = {
  DragHandle,
  // Make <a> in MDX use react-router for internal links so we test that path too
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const href = props.href ?? ''
    if (href.startsWith('/')) {
      return <Link to={href} className="text-vermilion underline decoration-1 underline-offset-4">{props.children}</Link>
    }
    return <a {...props} className="text-vermilion underline decoration-1 underline-offset-4" />
  },
}

export function TestMDX() {
  return (
    <main className="mx-auto max-w-[680px] px-6 py-16">
      <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-dim mb-8">
        MDX · KaTeX · Component · Router smoke
      </p>
      <article
        className="font-serif text-[19px] leading-[1.7] text-ink space-y-6
                   [&_h1]:font-serif [&_h1]:text-[32px] [&_h1]:font-semibold [&_h1]:mt-0 [&_h1]:mb-8
                   [&_h2]:font-serif [&_h2]:text-[22px] [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-3
                   [&_p]:my-0
                   [&_.katex-display]:my-6"
      >
        <MDXProvider components={components}>
          <Hello />
        </MDXProvider>
      </article>
    </main>
  )
}
