import { MDXProvider } from '@mdx-js/react'
import { Link } from 'react-router-dom'
import { TopicPage, type ActDef } from '../../components/topic/TopicPage'
import { Act } from '../../components/topic/Act'
import { ChapterFooter } from '../../components/topic/ChapterFooter'

// Playables
import { CauchyMemoir } from '../../playables/optimization/CauchyMemoir'
import { MountainClimber } from '../../playables/optimization/MountainClimber'
import { LearningRate } from '../../playables/optimization/LearningRate'
import { Momentum } from '../../playables/optimization/Momentum'
import { NonConvex } from '../../playables/optimization/NonConvex'
import { LossLandscape3D } from '../../playables/optimization/LossLandscape3D'
import { LinRegRevisited } from '../../playables/optimization/LinRegRevisited'
import { Closing } from '../../playables/optimization/Closing'

// Prose (MDX)
import CauchyMemoirProse from '../../content/optimization/coldOpen.mdx'
import MountainProse from '../../content/optimization/mountain.mdx'
import LearningRateProse from '../../content/optimization/learningRate.mdx'
import MomentumProse from '../../content/optimization/momentum.mdx'
import NonConvexProse from '../../content/optimization/nonConvex.mdx'
import LossLandscape3DProse from '../../content/optimization/lossLandscape3D.mdx'
import LinRegRevisitedProse from '../../content/optimization/linearRegressionRevisited.mdx'
import ClosingProse from '../../content/optimization/closing.mdx'

// PLAN §7.6 — Optimization, 8 acts.
const acts: ActDef[] = [
  { id: 'cold-open', label: 'Cauchy · 1847' },
  { id: 'mountain', label: 'Walk downhill' },
  { id: 'learning-rate', label: 'How big a step' },
  { id: 'momentum', label: 'Rolling through bouncing' },
  { id: 'non-convex', label: 'Saddles and basins' },
  { id: 'loss-landscape-3d', label: 'The bowl, rotated' },
  { id: 'linear-regression-revisited', label: 'Why Gauss had a formula' },
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

export function Optimization() {
  return (
    <TopicPage
      topicId="optimization"
      topicName="Optimization"
      acts={acts}
      canvas={(currentActId) => {
        switch (currentActId) {
          case 'cold-open':
            return <CauchyMemoir />
          case 'mountain':
            return <MountainClimber />
          case 'learning-rate':
            return <LearningRate />
          case 'momentum':
            return <Momentum />
          case 'non-convex':
            return <NonConvex />
          case 'loss-landscape-3d':
            return <LossLandscape3D />
          case 'linear-regression-revisited':
            return <LinRegRevisited />
          case 'closing':
            return <Closing />
          default:
            return <CauchyMemoir />
        }
      }}
    >
      <MDXProvider components={mdxComponents}>
        <CauchyMemoirProse />
        <MountainProse />
        <LearningRateProse />
        <MomentumProse />
        <NonConvexProse />
        <LossLandscape3DProse />
        <LinRegRevisitedProse />
        <ClosingProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={11}
        totalChapters={26}
        topicName="Optimization"
        nextTopicId="logistic-regression"
        nextTopicName="Logistic regression"
      />
    </TopicPage>
  )
}
