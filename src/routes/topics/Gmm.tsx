import { MDXProvider } from '@mdx-js/react'
import { Link } from 'react-router-dom'
import { TopicPage, type ActDef } from '../../components/topic/TopicPage'
import { Act } from '../../components/topic/Act'
import { ChapterFooter } from '../../components/topic/ChapterFooter'

// Playables — one per act, document order
import { SoftKMeans } from '../../playables/gmm/SoftKMeans'
import { TheMixture } from '../../playables/gmm/TheMixture'
import { Responsibilities } from '../../playables/gmm/Responsibilities'
import { EmEStep } from '../../playables/gmm/EmEStep'
import { EmMStep } from '../../playables/gmm/EmMStep'
import { EmLoop } from '../../playables/gmm/EmLoop'
import { Closing } from '../../playables/gmm/Closing'

// Prose
import ColdOpenProse from '../../content/gmm/coldOpen.mdx'
import TheMixtureProse from '../../content/gmm/theMixture.mdx'
import ResponsibilitiesProse from '../../content/gmm/responsibilities.mdx'
import EmEStepProse from '../../content/gmm/emEStep.mdx'
import EmMStepProse from '../../content/gmm/emMStep.mdx'
import EmLoopProse from '../../content/gmm/emLoop.mdx'
import ClosingProse from '../../content/gmm/closing.mdx'

const acts: ActDef[] = [
  { id: 'cold-open', label: 'Soft K-means' },
  { id: 'the-mixture', label: 'Sum of Gaussians' },
  { id: 'responsibilities', label: 'Soft assignment' },
  { id: 'em-e-step', label: 'E step · responsibilities' },
  { id: 'em-m-step', label: 'M step · refit' },
  { id: 'em-loop', label: 'Run until convergence' },
  { id: 'closing', label: 'Density estimation is the gateway' },
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

export function Gmm() {
  return (
    <TopicPage
      topicId="gmm"
      topicName="Gaussian Mixture Models"
      acts={acts}
      canvas={(currentActId) => {
        switch (currentActId) {
          case 'cold-open':
            return <SoftKMeans />
          case 'the-mixture':
            return <TheMixture />
          case 'responsibilities':
            return <Responsibilities />
          case 'em-e-step':
            return <EmEStep />
          case 'em-m-step':
            return <EmMStep />
          case 'em-loop':
            return <EmLoop />
          case 'closing':
            return <Closing />
          default:
            return <SoftKMeans />
        }
      }}
    >
      <MDXProvider components={mdxComponents}>
        <ColdOpenProse />
        <TheMixtureProse />
        <ResponsibilitiesProse />
        <EmEStepProse />
        <EmMStepProse />
        <EmLoopProse />
        <ClosingProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={16}
        totalChapters={26}
        topicName="Gaussian Mixture Models"
        nextTopicId="svm"
        nextTopicName="Support Vector Machines"
        nextStatus="coming-soon"
      />
    </TopicPage>
  )
}
