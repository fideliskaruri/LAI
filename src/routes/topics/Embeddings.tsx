import { MDXProvider } from '@mdx-js/react'
import { Link } from 'react-router-dom'
import { TopicPage, type ActDef } from '../../components/topic/TopicPage'
import { Act } from '../../components/topic/Act'
import { ChapterFooter } from '../../components/topic/ChapterFooter'
import { Recall } from '../../components/recall/RecallCard'

// Playables
import { MikolovMoment } from '../../playables/embeddings/MikolovMoment'
import { KingMinusManPlusWoman } from '../../playables/embeddings/KingMinusManPlusWoman'
import { CbowSkipgram } from '../../playables/embeddings/CbowSkipgram'
import { NearestNeighbors } from '../../playables/embeddings/NearestNeighbors'
import { AnalogyArithmetic } from '../../playables/embeddings/AnalogyArithmetic'
import { TheActualDimensions } from '../../playables/embeddings/TheActualDimensions'
import { Closing } from '../../playables/embeddings/Closing'

// Prose
import ColdOpenProse from '../../content/embeddings/coldOpen.mdx'
import ThePromiseProse from '../../content/embeddings/thePromise.mdx'
import CbowSkipgramProse from '../../content/embeddings/cbowSkipgram.mdx'
import NearestNeighborsProse from '../../content/embeddings/nearestNeighbors.mdx'
import AnalogyArithmeticProse from '../../content/embeddings/analogyArithmetic.mdx'
import TheActualDimensionsProse from '../../content/embeddings/theActualDimensions.mdx'
import ClosingProse from '../../content/embeddings/closing.mdx'

// Chapter 20 — Word embeddings. Seven acts: Mikolov 2013, the analogy
// promise, CBOW/Skip-gram, nearest neighbors in 2D, vector arithmetic,
// the actual 300-dimensional vector, and the forward bridge to attention.
const acts: ActDef[] = [
  { id: 'cold-open', label: 'Mikolov · 2013' },
  { id: 'the-promise', label: 'king − man + woman' },
  { id: 'cbow-skipgram', label: 'CBOW · Skip-gram' },
  { id: 'nearest-neighbors', label: 'Clusters of meaning' },
  { id: 'analogy-arithmetic', label: 'Arithmetic on words' },
  { id: 'the-actual-dimensions', label: '300 numbers' },
  { id: 'closing', label: 'Forward to attention' },
]

const mdxComponents = {
  Act,
  Recall,
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

export function Embeddings() {
  return (
    <TopicPage
      topicId="embeddings"
      topicName="Word embeddings"
      acts={acts}
      canvas={(currentActId) => {
        switch (currentActId) {
          case 'cold-open':
            return <MikolovMoment />
          case 'the-promise':
            return <KingMinusManPlusWoman />
          case 'cbow-skipgram':
            return <CbowSkipgram />
          case 'nearest-neighbors':
            return <NearestNeighbors />
          case 'analogy-arithmetic':
            return <AnalogyArithmetic />
          case 'the-actual-dimensions':
            return <TheActualDimensions />
          case 'closing':
            return <Closing />
          default:
            return <MikolovMoment />
        }
      }}
    >
      <MDXProvider components={mdxComponents}>
        <ColdOpenProse />
        <ThePromiseProse />
        <CbowSkipgramProse />
        <NearestNeighborsProse />
        <AnalogyArithmeticProse />
        <TheActualDimensionsProse />
        <ClosingProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={20}
        totalChapters={26}
        topicName="Word embeddings"
        nextTopicId="attention"
        nextTopicName="Attention"
        nextStatus="coming-soon"
      />
    </TopicPage>
  )
}
