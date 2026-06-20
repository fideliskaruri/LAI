import { MDXProvider } from '@mdx-js/react'
import { Link } from 'react-router-dom'
import { TopicPage, type ActDef } from '../../components/topic/TopicPage'
import { Act } from '../../components/topic/Act'
import { ChapterFooter } from '../../components/topic/ChapterFooter'
import { Recall } from '../../components/recall/RecallCard'

// Playables
import { ColdOpenScene } from '../../playables/vectors/ColdOpenScene'
import { StevinWreath } from '../../playables/vectors/StevinWreath'
import { CoordinatePlane } from '../../playables/vectors/CoordinatePlane'
import { DraggableArrow } from '../../playables/vectors/DraggableArrow'
import { Parallelogram } from '../../playables/vectors/Parallelogram'
import { ScalarMul } from '../../playables/vectors/ScalarMul'
import { Magnitude } from '../../playables/vectors/Magnitude'
import { Direction } from '../../playables/vectors/Direction'
import { HamiltonBridge } from '../../playables/vectors/HamiltonBridge'
import { NotationSplit } from '../../playables/vectors/NotationSplit'
import { NDLeap, type NDState } from '../../playables/vectors/NDLeap'
import { ClosingThread } from '../../playables/vectors/ClosingThread'

// Prose
import ColdOpenProse from '../../content/vectors/coldOpen.mdx'
import StevinProse from '../../content/vectors/stevin.mdx'
import DescartesProse from '../../content/vectors/descartes.mdx'
import ArrowProse from '../../content/vectors/arrow.mdx'
import AdditionProse from '../../content/vectors/addition.mdx'
import ScalarProse from '../../content/vectors/scalar.mdx'
import MagnitudeProse from '../../content/vectors/magnitude.mdx'
import DirectionProse from '../../content/vectors/direction.mdx'
import HamiltonProse from '../../content/vectors/hamilton.mdx'
import GibbsProse from '../../content/vectors/gibbsResolution.mdx'
import NDProse from '../../content/vectors/nD.mdx'
import ClosingProse from '../../content/vectors/closing.mdx'

// Phase 3: all 15 acts (nD leap split into 4 sub-acts).
const acts: ActDef[] = [
  { id: 'cold-open', label: 'The fight · 1893' },
  { id: 'stevin', label: 'Stevin · 1586' },
  { id: 'descartes', label: 'Descartes · 1637' },
  { id: 'arrow', label: 'From point to arrow' },
  { id: 'addition', label: 'The parallelogram' },
  { id: 'scalar', label: 'Scaling' },
  { id: 'magnitude', label: 'Pythagoras' },
  { id: 'direction', label: 'Direction' },
  { id: 'hamilton', label: 'Hamilton · 1843' },
  { id: 'gibbs-resolution', label: 'Gibbs · 1881' },
  { id: 'nd-1', label: 'nD · 2D' },
  { id: 'nd-2', label: 'nD · 3D' },
  { id: 'nd-3', label: 'nD · axes fade' },
  { id: 'nd-4', label: 'nD · numbers' },
  { id: 'closing', label: 'Stevin → king' },
]

const mdxComponents = {
  Act,
  Recall,
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

export function Vectors() {
  return (
    <TopicPage
      topicId="vectors"
      topicName="Vectors"
      acts={acts}
      canvas={(currentActId) => {
        switch (currentActId) {
          case 'cold-open':
            return <ColdOpenScene />
          case 'stevin':
            return <StevinWreath />
          case 'descartes':
            return <CoordinatePlane />
          case 'arrow':
            return <DraggableArrow />
          case 'addition':
            return <Parallelogram />
          case 'scalar':
            return <ScalarMul />
          case 'magnitude':
            return <Magnitude />
          case 'direction':
            return <Direction />
          case 'hamilton':
            return <HamiltonBridge />
          case 'gibbs-resolution':
            return <NotationSplit />
          case 'nd-1':
          case 'nd-2':
          case 'nd-3':
          case 'nd-4':
            return <NDLeap state={currentActId as NDState} />
          case 'closing':
            return <ClosingThread />
          default:
            return <StevinWreath />
        }
      }}
    >
      <MDXProvider components={mdxComponents}>
        <ColdOpenProse />
        <StevinProse />
        <DescartesProse />
        <ArrowProse />
        <AdditionProse />
        <ScalarProse />
        <MagnitudeProse />
        <DirectionProse />
        <HamiltonProse />
        <GibbsProse />
        <NDProse />
        <ClosingProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={1}
        totalChapters={26}
        topicName="Vectors"
        nextTopicId="functions"
        nextTopicName="Functions and change"
      />
    </TopicPage>
  )
}
