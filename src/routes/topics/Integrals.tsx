import { MDXProvider } from '@mdx-js/react'
import { Link } from 'react-router-dom'
import { TopicPage, type ActDef } from '../../components/topic/TopicPage'
import { Act } from '../../components/topic/Act'
import { ChapterFooter } from '../../components/topic/ChapterFooter'

// Playables
import { ArchimedesSegment } from '../../playables/integrals/ArchimedesSegment'
import { AreaUnderCurve } from '../../playables/integrals/AreaUnderCurve'
import { RiemannSums } from '../../playables/integrals/RiemannSums'
import { IntegralDefined } from '../../playables/integrals/IntegralDefined'
import { FundamentalTheorem } from '../../playables/integrals/FundamentalTheorem'
import { NumericalIntegration } from '../../playables/integrals/NumericalIntegration'
import { Closing } from '../../playables/integrals/Closing'

// Prose (MDX)
import ColdOpenProse from '../../content/integrals/coldOpen.mdx'
import AreaUnderCurveProse from '../../content/integrals/areaUnderCurve.mdx'
import RiemannSumsProse from '../../content/integrals/riemannSums.mdx'
import IntegralDefinedProse from '../../content/integrals/integralDefined.mdx'
import FundamentalTheoremProse from '../../content/integrals/fundamentalTheorem.mdx'
import NumericalProse from '../../content/integrals/numerical.mdx'
import ClosingProse from '../../content/integrals/closing.mdx'

// PLAN §7.6 — Integrals, 7 acts.
const acts: ActDef[] = [
  { id: 'cold-open', label: 'Archimedes · 250 BCE' },
  { id: 'area-under-curve', label: 'The question, sharper' },
  { id: 'riemann-sums', label: 'Bracketing with rectangles' },
  { id: 'integral-defined', label: 'The limit, named' },
  { id: 'fundamental-theorem', label: 'Newton–Leibniz' },
  { id: 'numerical', label: 'Simpson’s rule' },
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

export function Integrals() {
  return (
    <TopicPage
      topicId="integrals"
      topicName="Integrals"
      acts={acts}
      canvas={(currentActId) => {
        switch (currentActId) {
          case 'cold-open':
            return <ArchimedesSegment />
          case 'area-under-curve':
            return <AreaUnderCurve />
          case 'riemann-sums':
            return <RiemannSums />
          case 'integral-defined':
            return <IntegralDefined />
          case 'fundamental-theorem':
            return <FundamentalTheorem />
          case 'numerical':
            return <NumericalIntegration />
          case 'closing':
            return <Closing />
          default:
            return <ArchimedesSegment />
        }
      }}
    >
      <MDXProvider components={mdxComponents}>
        <ColdOpenProse />
        <AreaUnderCurveProse />
        <RiemannSumsProse />
        <IntegralDefinedProse />
        <FundamentalTheoremProse />
        <NumericalProse />
        <ClosingProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={4}
        totalChapters={26}
        topicName="Integrals"
        nextTopicId="optimization"
        nextTopicName="Optimization"
      />
    </TopicPage>
  )
}
