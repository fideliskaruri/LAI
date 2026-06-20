import { MDXProvider } from '@mdx-js/react'
import { Link } from 'react-router-dom'
import { TopicPage, type ActDef } from '../../components/topic/TopicPage'
import { Act } from '../../components/topic/Act'
import { ChapterFooter } from '../../components/topic/ChapterFooter'

// Playables — one per act, in document order
import { SalonDice } from '../../playables/probability/SalonDice'
import { SampleSpace } from '../../playables/probability/SampleSpace'
import { EventTabs } from '../../playables/probability/EventTabs'
import { MereProblem } from '../../playables/probability/MereProblem'
import { ConditionalFilter } from '../../playables/probability/ConditionalFilter'
import { IndependenceCheck } from '../../playables/probability/IndependenceCheck'
import { BayesSwitch } from '../../playables/probability/BayesSwitch'
import { ClosingThread } from '../../playables/probability/ClosingThread'

// Prose
import ColdOpenProse from '../../content/probability/coldOpen.mdx'
import SampleSpaceProse from '../../content/probability/sampleSpace.mdx'
import EventsProse from '../../content/probability/events.mdx'
import MereProse from '../../content/probability/mereProblem.mdx'
import ConditionalProse from '../../content/probability/conditional.mdx'
import IndependenceProse from '../../content/probability/independence.mdx'
import BayesProse from '../../content/probability/bayes.mdx'
import ClosingProse from '../../content/probability/closing.mdx'

// Eight acts per PLAN §7.4
const acts: ActDef[] = [
  { id: 'cold-open', label: 'Salon · 1654' },
  { id: 'sample-space', label: 'Sample space' },
  { id: 'events', label: 'Events' },
  { id: 'mere-problem', label: "Méré's bet" },
  { id: 'conditional', label: 'Conditional' },
  { id: 'independence', label: 'Independence' },
  { id: 'bayes', label: 'Bayes · 1763' },
  { id: 'closing', label: 'On average' },
]

const mdxComponents = {
  Act,
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const href = props.href ?? ''
    if (href.startsWith('/')) {
      return (
        <Link
          to={href}
          className="text-vermilion underline decoration-1 underline-offset-4 hover:text-vermilion-deep"
        >
          {props.children}
        </Link>
      )
    }
    return <a {...props} target="_blank" rel="noreferrer" />
  },
}

export function Probability() {
  return (
    <TopicPage
      topicId="probability"
      topicName="Probability"
      acts={acts}
      canvas={(currentActId) => {
        switch (currentActId) {
          case 'cold-open':
            return <SalonDice />
          case 'sample-space':
            return <SampleSpace />
          case 'events':
            return <EventTabs />
          case 'mere-problem':
            return <MereProblem />
          case 'conditional':
            return <ConditionalFilter />
          case 'independence':
            return <IndependenceCheck />
          case 'bayes':
            return <BayesSwitch />
          case 'closing':
            return <ClosingThread />
          default:
            return <SampleSpace />
        }
      }}
    >
      <MDXProvider components={mdxComponents}>
        <ColdOpenProse />
        <SampleSpaceProse />
        <EventsProse />
        <MereProse />
        <ConditionalProse />
        <IndependenceProse />
        <BayesProse />
        <ClosingProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={7}
        totalChapters={26}
        topicName="Probability"
        nextTopicId="expectation"
        nextTopicName="Expectation and variance"
        nextStatus="coming-soon"
      />
    </TopicPage>
  )
}
