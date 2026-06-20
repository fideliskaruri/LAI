import { MDXProvider } from '@mdx-js/react'
import { Link } from 'react-router-dom'
import { TopicPage, type ActDef } from '../../components/topic/TopicPage'
import { Act } from '../../components/topic/Act'
import { ChapterFooter } from '../../components/topic/ChapterFooter'

// Playables
import { CayleyTitle } from '../../playables/matrices/CayleyTitle'
import { BasisIntro } from '../../playables/matrices/BasisIntro'
import { DraggableBasis } from '../../playables/matrices/DraggableBasis'
import { VectorFollowsBasis } from '../../playables/matrices/VectorFollowsBasis'
import { PureRotation } from '../../playables/matrices/PureRotation'
import { ScaleAndShear } from '../../playables/matrices/ScaleAndShear'
import { Determinant } from '../../playables/matrices/Determinant'

// Prose
import ColdOpenProse from '../../content/matrices/coldOpen.mdx'
import IAndJProse from '../../content/matrices/iAndJ.mdx'
import MoveIAndJProse from '../../content/matrices/moveIAndJ.mdx'
import WhereDoesVLandProse from '../../content/matrices/whereDoesVLand.mdx'
import PureRotationProse from '../../content/matrices/pureRotation.mdx'
import PureScaleAndShearProse from '../../content/matrices/pureScaleAndShear.mdx'
import ClosingProse from '../../content/matrices/closing.mdx'

const acts: ActDef[] = [
  { id: 'cold-open', label: 'Cayley · 1858' },
  { id: 'i-and-j', label: 'î and ĵ' },
  { id: 'move-i-and-j', label: 'Move the basis' },
  { id: 'where-does-v-land', label: 'Where does v land?' },
  { id: 'pure-rotation', label: 'Rotation' },
  { id: 'pure-scale-and-shear', label: 'Scale and shear' },
  { id: 'closing', label: 'Determinant' },
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

export function Matrices() {
  return (
    <TopicPage
      topicId="matrices"
      topicName="Matrices as transformations"
      acts={acts}
      canvas={(currentActId) => {
        switch (currentActId) {
          case 'cold-open':
            return <CayleyTitle />
          case 'i-and-j':
            return <BasisIntro />
          case 'move-i-and-j':
            return <DraggableBasis />
          case 'where-does-v-land':
            return <VectorFollowsBasis />
          case 'pure-rotation':
            return <PureRotation />
          case 'pure-scale-and-shear':
            return <ScaleAndShear />
          case 'closing':
            return <Determinant />
          default:
            return <DraggableBasis />
        }
      }}
    >
      <MDXProvider components={mdxComponents}>
        <ColdOpenProse />
        <IAndJProse />
        <MoveIAndJProse />
        <WhereDoesVLandProse />
        <PureRotationProse />
        <PureScaleAndShearProse />
        <ClosingProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={5}
        totalChapters={26}
        topicName="Matrices as transformations"
        nextTopicId="eigenvalues"
        nextTopicName="Eigenvalues"
      />
    </TopicPage>
  )
}
