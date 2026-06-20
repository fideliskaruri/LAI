import { MDXProvider } from '@mdx-js/react'
import { Link } from 'react-router-dom'
import {
  TopicPageSplit,
  type SplitActDef,
  type SplitCanvasRenderProps,
} from '../../components/topic/TopicPageSplit'
import { Act } from '../../components/topic/Act'
import { ChapterFooter } from '../../components/topic/ChapterFooter'

// Playables — paired Left/Right panes per act
import { PearsonLeftPane, PearsonTitlePagePane } from '../../playables/pca/PearsonDesk'
import {
  CorrelatedCloudLeftPane,
  CorrelatedCloudRightPane,
} from '../../playables/pca/CorrelatedCloud'
import {
  FindTheAxisLeftPane,
  FindTheAxisRightPane,
  type FindTheAxisState,
} from '../../playables/pca/FindTheAxis'
import { Pc1AndPc2LeftPane, Pc1AndPc2RightPane } from '../../playables/pca/Pc1AndPc2'
import {
  EigenvectorsLeftPane,
  CovarianceMatrixPane,
} from '../../playables/pca/EigenvectorsOfCovariance'
import {
  ReconstructionLeftPane,
  ReconstructionRightPane,
  type ReconstructionState,
} from '../../playables/pca/ReconstructionWithK'
import { ClosingLeftPane, ClosingRightPane } from '../../playables/pca/Closing'

// Prose
import ColdOpenProse from '../../content/pca/coldOpen.mdx'
import TheCloudProse from '../../content/pca/theCloud.mdx'
import FindTheAxisProse from '../../content/pca/findTheAxis.mdx'
import Pc1AndPc2Prose from '../../content/pca/pc1AndPc2.mdx'
import EigenvectorsOfCovarianceProse from '../../content/pca/eigenvectorsOfCovariance.mdx'
import ReconstructionWithKProse from '../../content/pca/reconstructionWithK.mdx'
import ClosingProse from '../../content/pca/closing.mdx'

/**
 * PCA — chapter 14. Uses the split-canvas template (PLAN §5.2): every act has
 * a paired LeftPane + RightPane. Sync modes per act:
 *
 *  - cold-open                    : independent  (Pearson sketch | journal title)
 *  - the-cloud                    : independent  (scatter | coordinate table)
 *  - find-the-axis                : left-drives-right  (rotatable line drives variance bar)
 *  - pc1-and-pc2                  : independent  (computed PCs | variance bars)
 *  - eigenvectors-of-covariance   : independent  (eigenvector arrows | Σ matrix)
 *  - reconstruction-with-k        : left-drives-right  (k-slider drives reconstruction)
 *  - closing                      : independent  (embedding sketch | downstream index)
 */

const acts: SplitActDef[] = [
  {
    id: 'cold-open',
    label: 'Pearson · 1901',
    syncMode: 'independent',
    initialLeft: {},
    initialRight: {},
  },
  {
    id: 'the-cloud',
    label: 'The cloud',
    syncMode: 'independent',
    initialLeft: {},
    initialRight: {},
  },
  {
    id: 'find-the-axis',
    label: 'Find one',
    syncMode: 'left-drives-right',
    initialLeft: { theta: Math.PI / 8 } as FindTheAxisState,
    initialRight: { theta: Math.PI / 8 } as FindTheAxisState,
    deriveRight: (l) => l as FindTheAxisState,
  },
  {
    id: 'pc1-and-pc2',
    label: 'Two of them',
    syncMode: 'independent',
    initialLeft: {},
    initialRight: {},
  },
  {
    id: 'eigenvectors-of-covariance',
    label: 'Σ and its eigen-things',
    syncMode: 'independent',
    initialLeft: {},
    initialRight: {},
  },
  {
    id: 'reconstruction-with-k',
    label: 'Drop an axis',
    syncMode: 'left-drives-right',
    initialLeft: { k: 1 } as ReconstructionState,
    initialRight: { k: 1 } as ReconstructionState,
    deriveRight: (l) => l as ReconstructionState,
  },
  {
    id: 'closing',
    label: 'Everywhere',
    syncMode: 'independent',
    initialLeft: {},
    initialRight: {},
  },
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

function leftCanvas(p: SplitCanvasRenderProps) {
  switch (p.currentActId) {
    case 'cold-open':
      return <PearsonLeftPane />
    case 'the-cloud':
      return <CorrelatedCloudLeftPane />
    case 'find-the-axis':
      return <FindTheAxisLeftPane {...p} />
    case 'pc1-and-pc2':
      return <Pc1AndPc2LeftPane />
    case 'eigenvectors-of-covariance':
      return <EigenvectorsLeftPane />
    case 'reconstruction-with-k':
      return <ReconstructionLeftPane {...p} />
    case 'closing':
      return <ClosingLeftPane />
    default:
      return <PearsonLeftPane />
  }
}

function rightCanvas(p: SplitCanvasRenderProps) {
  switch (p.currentActId) {
    case 'cold-open':
      return <PearsonTitlePagePane />
    case 'the-cloud':
      return <CorrelatedCloudRightPane />
    case 'find-the-axis':
      return <FindTheAxisRightPane {...p} />
    case 'pc1-and-pc2':
      return <Pc1AndPc2RightPane />
    case 'eigenvectors-of-covariance':
      return <CovarianceMatrixPane />
    case 'reconstruction-with-k':
      return <ReconstructionRightPane {...p} />
    case 'closing':
      return <ClosingRightPane />
    default:
      return <PearsonTitlePagePane />
  }
}

export function Pca() {
  return (
    <TopicPageSplit
      topicId="pca"
      topicName="PCA"
      acts={acts}
      leftCanvas={leftCanvas}
      rightCanvas={rightCanvas}
    >
      <MDXProvider components={mdxComponents}>
        <ColdOpenProse />
        <TheCloudProse />
        <FindTheAxisProse />
        <Pc1AndPc2Prose />
        <EigenvectorsOfCovarianceProse />
        <ReconstructionWithKProse />
        <ClosingProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={14}
        totalChapters={26}
        topicName="PCA"
        nextTopicId="clustering"
        nextTopicName="K-means clustering"
        nextStatus="available"
      />
    </TopicPageSplit>
  )
}
