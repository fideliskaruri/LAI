import { Link } from 'react-router-dom'
import { topics } from '../../data/constellation'

export interface ChapterFooterProps {
  chapterNum: number
  totalChapters: number
  topicName: string
  nextTopicId: string | null
  nextTopicName: string | null
  nextStatus?: 'available' | 'coming-soon'
}

/**
 * End-of-chapter punctuation. Tells the reader they just finished something,
 * names what's next, and gives a one-tap path back to the constellation.
 *
 * Visual register: generous whitespace, centered measure, the same vermilion
 * accent the rest of the topic uses. Sits AFTER the prose / MDX block so it
 * reads as a coda, not a control bar.
 */
export function ChapterFooter({
  chapterNum,
  totalChapters,
  topicName,
  nextTopicId,
  nextTopicName,
  nextStatus,
}: ChapterFooterProps) {
  const hasNext = nextTopicId !== null && nextTopicName !== null
  const resolvedNextStatus: 'available' | 'coming-soon' =
    nextStatus ??
    (nextTopicId
      ? (topics.find((t) => t.id === nextTopicId)?.status ?? 'coming-soon')
      : 'coming-soon')

  return (
    <footer
      className="w-full flex flex-col items-center text-center"
      style={{ paddingTop: '12vh', paddingBottom: '8vh' }}
      aria-label={`End of chapter ${chapterNum}: ${topicName}`}
    >
      <div className="w-full" style={{ maxWidth: '580px' }}>
        {/* Eyebrow: small caps, vermilion, tracked */}
        <p
          className="text-vermilion font-sans uppercase"
          style={{
            fontSize: '11px',
            letterSpacing: '0.22em',
            margin: 0,
          }}
        >
          You finished chapter {chapterNum} of {totalChapters}
        </p>

        {/* Topic name: serif, ink, semibold */}
        <h2
          className="text-ink font-serif"
          style={{
            fontSize: '32px',
            fontWeight: 600,
            lineHeight: 1.15,
            marginTop: '18px',
            marginBottom: 0,
          }}
        >
          {topicName}
        </h2>

        {/* Thin vermilion rule */}
        <hr
          aria-hidden="true"
          className="bg-vermilion border-0"
          style={{
            height: '1px',
            width: '80px',
            marginTop: '36px',
            marginBottom: '36px',
            marginLeft: 'auto',
            marginRight: 'auto',
            backgroundColor: 'currentColor',
            color: 'var(--color-vermilion)',
          }}
        />

        {/* What's next */}
        <p
          className="text-dim font-serif italic"
          style={{
            fontSize: '15px',
            lineHeight: 1.65,
            margin: 0,
          }}
        >
          {hasNext ? (
            resolvedNextStatus === 'available' ? (
              <>
                Next, we look at{' '}
                <Link
                  to={`/${nextTopicId}`}
                  className="text-vermilion underline decoration-1 hover:text-vermilion-deep not-italic"
                  style={{ textUnderlineOffset: '4px' }}
                >
                  {nextTopicName}
                </Link>
                .
              </>
            ) : (
              <>
                Next, we look at{' '}
                <span className="text-dim not-italic">{nextTopicName}</span>
                {' '}&mdash; coming soon.
              </>
            )
          ) : (
            <>That&rsquo;s the last chapter. For now.</>
          )}
        </p>

        {/* Back to constellation */}
        <div style={{ marginTop: '48px' }}>
          <Link
            to="/"
            className="text-vermilion font-serif italic underline decoration-1 hover:text-vermilion-deep"
            style={{
              fontSize: '16px',
              textUnderlineOffset: '4px',
            }}
          >
            &#8629; Back to the constellation
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default ChapterFooter
