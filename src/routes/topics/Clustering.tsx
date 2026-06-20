import { MDXProvider } from '@mdx-js/react'
import { Link } from 'react-router-dom'
import { TopicPage, type ActDef } from '../../components/topic/TopicPage'
import { Act } from '../../components/topic/Act'
import { ChapterFooter } from '../../components/topic/ChapterFooter'

// Playables
import { LloydMemo } from '../../playables/clustering/LloydMemo'
import { LabeledScatter } from '../../playables/clustering/LabeledScatter'
import { RandomInit } from '../../playables/clustering/RandomInit'
import { AssignmentStep } from '../../playables/clustering/AssignmentStep'
import { UpdateStep } from '../../playables/clustering/UpdateStep'
import { InitSensitivity } from '../../playables/clustering/InitSensitivity'
import { Closing } from '../../playables/clustering/Closing'

// Prose
import ColdOpenProse from '../../content/clustering/coldOpen.mdx'
import TheProblemProse from '../../content/clustering/theProblem.mdx'
import RandomInitProse from '../../content/clustering/randomInit.mdx'
import AssignmentStepProse from '../../content/clustering/assignmentStep.mdx'
import UpdateStepProse from '../../content/clustering/updateStep.mdx'
import InitSensitivityProse from '../../content/clustering/initSensitivity.mdx'
import ClosingProse from '../../content/clustering/closing.mdx'

const acts: ActDef[] = [
  { id: 'cold-open', label: 'Lloyd · 1957' },
  { id: 'the-problem', label: 'Points without labels' },
  { id: 'random-init', label: 'Start anywhere' },
  { id: 'assignment-step', label: 'Assign · nearest king' },
  { id: 'update-step', label: 'Update · centroid walks' },
  { id: 'init-sensitivity', label: 'Where you start matters' },
  { id: 'closing', label: 'Soft clusters are next' },
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

export function Clustering() {
  return (
    <TopicPage
      topicId="clustering"
      topicName="K-means clustering"
      acts={acts}
      canvas={(currentActId) => {
        switch (currentActId) {
          case 'cold-open':
            return <LloydMemo />
          case 'the-problem':
            return <LabeledScatter />
          case 'random-init':
            return <RandomInit />
          case 'assignment-step':
            return <AssignmentStep />
          case 'update-step':
            return <UpdateStep />
          case 'init-sensitivity':
            return <InitSensitivity />
          case 'closing':
            return <Closing />
          default:
            return <LloydMemo />
        }
      }}
    >
      <MDXProvider components={mdxComponents}>
        <ColdOpenProse />
        <TheProblemProse />
        <RandomInitProse />
        <AssignmentStepProse />
        <UpdateStepProse />
        <InitSensitivityProse />
        <ClosingProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={15}
        totalChapters={26}
        topicName="K-means clustering"
        nextTopicId="gmm"
        nextTopicName="Gaussian Mixture Models"
      />
    </TopicPage>
  )
}
