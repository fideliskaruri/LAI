import { MDXProvider } from '@mdx-js/react'
import { Link } from 'react-router-dom'
import { TopicPage, type ActDef } from '../../components/topic/TopicPage'
import { Act } from '../../components/topic/Act'
import { ChapterFooter } from '../../components/topic/ChapterFooter'

// Playables
import { CauchyMemoir } from '../../playables/eigenvalues/CauchyMemoir'
import { WhichDirections } from '../../playables/eigenvalues/WhichDirections'
import { FindFixedLine } from '../../playables/eigenvalues/FindFixedLine'
import { TwoEigenvectors } from '../../playables/eigenvalues/TwoEigenvectors'
import { CharacteristicPoly } from '../../playables/eigenvalues/CharacteristicPoly'
import { PcaPreview } from '../../playables/eigenvalues/PcaPreview'
import { Closing } from '../../playables/eigenvalues/Closing'

// Prose
import ColdOpenProse from '../../content/eigenvalues/coldOpen.mdx'
import TheQuestionProse from '../../content/eigenvalues/theQuestion.mdx'
import FindFixedLineProse from '../../content/eigenvalues/findFixedLine.mdx'
import TwoEigenvectorsProse from '../../content/eigenvalues/twoEigenvectors.mdx'
import CharacteristicPolyProse from '../../content/eigenvalues/characteristicPoly.mdx'
import PcaPreviewProse from '../../content/eigenvalues/pcaPreview.mdx'
import ClosingProse from '../../content/eigenvalues/closing.mdx'

const acts: ActDef[] = [
  { id: 'cold-open', label: 'Cauchy · 1829' },
  { id: 'the-question', label: 'The question' },
  { id: 'find-the-fixed-line', label: 'Find one' },
  { id: 'two-eigenvectors', label: 'Two of them' },
  { id: 'characteristic-polynomial', label: 'The algebra' },
  { id: 'pca-preview', label: 'Why we care' },
  { id: 'closing', label: 'Three rooms' },
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

export function Eigenvalues() {
  return (
    <TopicPage
      topicId="eigenvalues"
      topicName="Eigenvalues"
      acts={acts}
      canvas={(currentActId) => {
        switch (currentActId) {
          case 'cold-open':
            return <CauchyMemoir />
          case 'the-question':
            return <WhichDirections />
          case 'find-the-fixed-line':
            return <FindFixedLine />
          case 'two-eigenvectors':
            return <TwoEigenvectors />
          case 'characteristic-polynomial':
            return <CharacteristicPoly />
          case 'pca-preview':
            return <PcaPreview />
          case 'closing':
            return <Closing />
          default:
            return <WhichDirections />
        }
      }}
    >
      <MDXProvider components={mdxComponents}>
        <ColdOpenProse />
        <TheQuestionProse />
        <FindFixedLineProse />
        <TwoEigenvectorsProse />
        <CharacteristicPolyProse />
        <PcaPreviewProse />
        <ClosingProse />
      </MDXProvider>
      <ChapterFooter
        chapterNum={6}
        totalChapters={26}
        topicName="Eigenvalues"
        nextTopicId="pca"
        nextTopicName="PCA"
        nextStatus="coming-soon"
      />
    </TopicPage>
  )
}
