import { MDXProvider } from '@mdx-js/react'
import { Link } from 'react-router-dom'
import { TopicPage, type ActDef } from '../../components/topic/TopicPage'
import { Act } from '../../components/topic/Act'
import { ChapterFooter } from '../../components/topic/ChapterFooter'

// Playables
import { NewtonPlague } from '../../playables/derivatives/NewtonPlague'
import { LeibnizPaper } from '../../playables/derivatives/LeibnizPaper'
import { SecantRecap } from '../../playables/derivatives/SecantRecap'
import { DerivativeDefined } from '../../playables/derivatives/DerivativeDefined'
import { Rules } from '../../playables/derivatives/Rules'
import { ChainRule } from '../../playables/derivatives/ChainRule'
import { ProductRule } from '../../playables/derivatives/ProductRule'
import { GradientIntro } from '../../playables/derivatives/GradientIntro'
import { Closing } from '../../playables/derivatives/Closing'

// Prose (MDX)
import NewtonPlagueProse from '../../content/derivatives/newtonPlague.mdx'
import LeibnizPaperProse from '../../content/derivatives/leibnizPaper.mdx'
import SecantRecapProse from '../../content/derivatives/secantRecap.mdx'
import DerivativeDefinedProse from '../../content/derivatives/derivativeDefined.mdx'
import RulesProse from '../../content/derivatives/rules.mdx'
import ChainRuleProse from '../../content/derivatives/chainRule.mdx'
import ProductRuleProse from '../../content/derivatives/productRule.mdx'
import GradientIntroProse from '../../content/derivatives/gradientIntro.mdx'
import ClosingProse from '../../content/derivatives/closing.mdx'

// PLAN §7.3 — Derivatives, 9 acts.
const acts: ActDef[] = [
  { id: 'cold-open', label: 'Newton · 1666' },
  { id: 'leibniz-1684', label: 'Leibniz · 1684' },
  { id: 'review-from-functions', label: 'The move, recalled' },
  { id: 'derivative-defined', label: 'The limit, written' },
  { id: 'rules', label: 'Power & sum rules' },
  { id: 'chain-rule', label: 'Composition' },
  { id: 'product-rule', label: 'Expanding rectangle' },
  { id: 'gradient-intro', label: 'The gradient' },
  { id: 'closing', label: 'The thread forward' },
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

export function Derivatives() {
  return (
    <TopicPage
      topicId="derivatives"
      topicName="Derivatives"
      acts={acts}
      canvas={(currentActId) => {
        switch (currentActId) {
          case 'cold-open':
            return <NewtonPlague />
          case 'leibniz-1684':
            return <LeibnizPaper />
          case 'review-from-functions':
            return <SecantRecap />
          case 'derivative-defined':
            return <DerivativeDefined />
          case 'rules':
            return <Rules />
          case 'chain-rule':
            return <ChainRule />
          case 'product-rule':
            return <ProductRule />
          case 'gradient-intro':
            return <GradientIntro />
          case 'closing':
            return <Closing />
          default:
            return <NewtonPlague />
        }
      }}
    >
      <MDXProvider components={mdxComponents}>
        <NewtonPlagueProse />
        <LeibnizPaperProse />
        <SecantRecapProse />
        <DerivativeDefinedProse />
        <RulesProse />
        <ChainRuleProse />
        <ProductRuleProse />
        <GradientIntroProse />
        <ClosingProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={3}
        totalChapters={26}
        topicName="Derivatives"
        nextTopicId="integrals"
        nextTopicName="Integrals"
        nextStatus="coming-soon"
      />
    </TopicPage>
  )
}
