import { MDXProvider } from '@mdx-js/react'
import { Link } from 'react-router-dom'
import { TopicPage, type ActDef } from '../../components/topic/TopicPage'
import { Act } from '../../components/topic/Act'
import { ChapterFooter } from '../../components/topic/ChapterFooter'

// Playables — one per act, in document order
import { GamblerLoss } from '../../playables/expectation/GamblerLoss'
import { WeightedAverage } from '../../playables/expectation/WeightedAverage'
import { LinearityCoupled } from '../../playables/expectation/LinearityCoupled'
import { LawOfLargeNumbers } from '../../playables/expectation/LawOfLargeNumbers'
import { VarianceSpread } from '../../playables/expectation/VarianceSpread'
import { StdDevWidth } from '../../playables/expectation/StdDevWidth'
import { Closing } from '../../playables/expectation/Closing'

// Prose
import ColdOpenProse from '../../content/expectation/coldOpen.mdx'
import WeightedAverageProse from '../../content/expectation/weightedAverage.mdx'
import LinearityProse from '../../content/expectation/linearOfExpectation.mdx'
import LLNProse from '../../content/expectation/lawOfLargeNumbers.mdx'
import VarianceProse from '../../content/expectation/varianceAsSpread.mdx'
import StdDevProse from '../../content/expectation/standardDeviation.mdx'
import ClosingProse from '../../content/expectation/closing.mdx'

// Seven acts per PLAN §7.6 (chapter 8: Expectation & variance)
const acts: ActDef[] = [
  { id: 'cold-open', label: 'A gambler’s expected loss' },
  { id: 'weighted-average', label: 'Expectation as the operator' },
  { id: 'linear-of-expectation', label: 'Linearity' },
  { id: 'law-of-large-numbers', label: 'Bernoulli, 1713' },
  { id: 'variance-as-spread', label: 'Spread' },
  { id: 'standard-deviation', label: 'σ' },
  { id: 'closing', label: 'Toward distributions' },
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

export function Expectation() {
  return (
    <TopicPage
      topicId="expectation"
      topicName="Expectation and variance"
      acts={acts}
      canvas={(currentActId) => {
        switch (currentActId) {
          case 'cold-open':
            return <GamblerLoss />
          case 'weighted-average':
            return <WeightedAverage />
          case 'linear-of-expectation':
            return <LinearityCoupled />
          case 'law-of-large-numbers':
            return <LawOfLargeNumbers />
          case 'variance-as-spread':
            return <VarianceSpread />
          case 'standard-deviation':
            return <StdDevWidth />
          case 'closing':
            return <Closing />
          default:
            return <WeightedAverage />
        }
      }}
    >
      <MDXProvider components={mdxComponents}>
        <ColdOpenProse />
        <WeightedAverageProse />
        <LinearityProse />
        <LLNProse />
        <VarianceProse />
        <StdDevProse />
        <ClosingProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={8}
        totalChapters={26}
        topicName="Expectation and variance"
        nextTopicId="distributions"
        nextTopicName="Distributions"
      />
    </TopicPage>
  )
}
