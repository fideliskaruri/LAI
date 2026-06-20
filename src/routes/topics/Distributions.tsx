import { MDXProvider } from '@mdx-js/react'
import { Link } from 'react-router-dom'
import { TopicPage, type ActDef } from '../../components/topic/TopicPage'
import { Act } from '../../components/topic/Act'
import { ChapterFooter } from '../../components/topic/ChapterFooter'

// Playables — one per act, in document order
import { GaussCeres } from '../../playables/distributions/GaussCeres'
import { Binomial } from '../../playables/distributions/Binomial'
import { BinomialToNormal } from '../../playables/distributions/BinomialToNormal'
import { Normal } from '../../playables/distributions/Normal'
import { Poisson } from '../../playables/distributions/Poisson'
import { CentralLimitTheorem } from '../../playables/distributions/CentralLimitTheorem'
import { Closing } from '../../playables/distributions/Closing'

// Prose
import ColdOpenProse from '../../content/distributions/coldOpen.mdx'
import BinomialProse from '../../content/distributions/binomial.mdx'
import FromBinomialToNormalProse from '../../content/distributions/fromBinomialToNormal.mdx'
import NormalProse from '../../content/distributions/normal.mdx'
import PoissonProse from '../../content/distributions/poisson.mdx'
import CentralLimitTheoremProse from '../../content/distributions/centralLimitTheorem.mdx'
import ClosingProse from '../../content/distributions/closing.mdx'

// Seven acts per PLAN §7.6 (chapter 9: Distributions)
const acts: ActDef[] = [
  { id: 'cold-open', label: 'Gauss · Ceres · 1801' },
  { id: 'binomial', label: 'Binomial — coin flips' },
  { id: 'from-binomial-to-normal', label: 'Discrete → continuous' },
  { id: 'normal', label: 'Normal — μ, σ' },
  { id: 'poisson', label: 'Poisson — rare events' },
  { id: 'central-limit-theorem', label: 'Central limit theorem' },
  { id: 'closing', label: 'Toward linear regression' },
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

export function Distributions() {
  return (
    <TopicPage
      topicId="distributions"
      topicName="Distributions"
      acts={acts}
      canvas={(currentActId) => {
        switch (currentActId) {
          case 'cold-open':
            return <GaussCeres />
          case 'binomial':
            return <Binomial />
          case 'from-binomial-to-normal':
            return <BinomialToNormal />
          case 'normal':
            return <Normal />
          case 'poisson':
            return <Poisson />
          case 'central-limit-theorem':
            return <CentralLimitTheorem />
          case 'closing':
            return <Closing />
          default:
            return <Normal />
        }
      }}
    >
      <MDXProvider components={mdxComponents}>
        <ColdOpenProse />
        <BinomialProse />
        <FromBinomialToNormalProse />
        <NormalProse />
        <PoissonProse />
        <CentralLimitTheoremProse />
        <ClosingProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={9}
        totalChapters={26}
        topicName="Distributions"
        nextTopicId="linear-regression"
        nextTopicName="Linear regression"
      />
    </TopicPage>
  )
}
