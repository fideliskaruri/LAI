import { MDXProvider } from '@mdx-js/react'
import { Link } from 'react-router-dom'
import { TopicPage, type ActDef } from '../../components/topic/TopicPage'
import { Act } from '../../components/topic/Act'
import { ChapterFooter } from '../../components/topic/ChapterFooter'

// Playables
import { GalileoIncline } from '../../playables/functions/GalileoIncline'
import { FunctionMachine } from '../../playables/functions/FunctionMachine'
import { FamilyToggle } from '../../playables/functions/FamilyToggle'
import { SlopeOnLinear } from '../../playables/functions/SlopeOnLinear'
import { SlopeOnCurve } from '../../playables/functions/SlopeOnCurve'
import { SecantToTangent } from '../../playables/functions/SecantToTangent'
import { DerivativeAsFunction } from '../../playables/functions/DerivativeAsFunction'

// Prose (MDX)
import ColdOpenProse from '../../content/functions/coldOpen.mdx'
import InputOutputProse from '../../content/functions/inputOutput.mdx'
import FamiliesProse from '../../content/functions/families.mdx'
import SlopeProse from '../../content/functions/slope.mdx'
import CurvesChangeSlopeProse from '../../content/functions/curvesChangeSlope.mdx'
import SecantToTangentProse from '../../content/functions/secantToTangent.mdx'
import DerivativeAsFunctionProse from '../../content/functions/derivativeAsFunction.mdx'

// PLAN §7.2 — Functions and change, 7 acts.
const acts: ActDef[] = [
  { id: 'cold-open', label: 'Galileo · ~1604' },
  { id: 'input-output', label: 'The machine' },
  { id: 'families', label: 'Three families' },
  { id: 'slope', label: 'A line’s slope' },
  { id: 'curves-change-slope', label: 'A curve’s slope' },
  { id: 'secant-to-tangent', label: 'Secant → tangent' },
  { id: 'derivative-as-function', label: 'The derivative' },
]

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

export function Functions() {
  return (
    <TopicPage
      topicId="functions"
      topicName="Functions and change"
      acts={acts}
      canvas={(currentActId) => {
        switch (currentActId) {
          case 'cold-open':
            return <GalileoIncline />
          case 'input-output':
            return <FunctionMachine />
          case 'families':
            return <FamilyToggle />
          case 'slope':
            return <SlopeOnLinear />
          case 'curves-change-slope':
            return <SlopeOnCurve />
          case 'secant-to-tangent':
            return <SecantToTangent />
          case 'derivative-as-function':
            return <DerivativeAsFunction />
          default:
            return <GalileoIncline />
        }
      }}
    >
      <MDXProvider components={mdxComponents}>
        <ColdOpenProse />
        <InputOutputProse />
        <FamiliesProse />
        <SlopeProse />
        <CurvesChangeSlopeProse />
        <SecantToTangentProse />
        <DerivativeAsFunctionProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={2}
        totalChapters={26}
        topicName="Functions and change"
        nextTopicId="derivatives"
        nextTopicName="Derivatives"
      />
    </TopicPage>
  )
}
