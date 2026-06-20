import { MDXProvider } from '@mdx-js/react'
import { Link } from 'react-router-dom'
import { TopicPage, type ActDef } from '../../components/topic/TopicPage'
import { Act } from '../../components/topic/Act'
import { StevinWreath } from '../../playables/vectors/StevinWreath'
import StevinProse from '../../content/vectors/stevin.mdx'

// Phase 1: only the Stevin act is wired. The other acts get added in Phase 2.
const acts: ActDef[] = [
  { id: 'stevin', label: 'Stevin · 1586' },
]

// MDX components in scope when prose renders.
const mdxComponents = {
  Act,
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const href = props.href ?? ''
    if (href.startsWith('/')) {
      return (
        <Link to={href} className="text-vermilion underline decoration-1 underline-offset-4 hover:text-vermilion-deep">
          {props.children}
        </Link>
      )
    }
    return <a {...props} target="_blank" rel="noreferrer" />
  },
}

export function Vectors() {
  return (
    <TopicPage
      topicId="vectors"
      topicName="Vectors"
      acts={acts}
      canvas={(currentActId) => {
        switch (currentActId) {
          case 'stevin':
            return <StevinWreath />
          default:
            return null
        }
      }}
    >
      <MDXProvider components={mdxComponents}>
        <StevinProse />
      </MDXProvider>
    </TopicPage>
  )
}
