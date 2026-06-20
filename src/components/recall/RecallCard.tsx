import { useEffect, useState } from 'react'
import {
  daysUntil,
  freshCard,
  getCard,
  reschedule,
  saveCard,
  type CardState,
} from './recallStorage'

/**
 * <Recall> — Quantum Country-style spaced-review card embedded in prose.
 *
 * Editorial register (FEATURES § Feature 1):
 *   • hairline rules above + below, 1px in fade
 *   • eyebrow RECALL in Inter small caps, vermilion
 *   • question Source Serif 4 italic 16px ink
 *   • "Show answer" → italic vermilion link
 *   • answer Source Serif 4 regular 15px dim
 *   • "Got it" / "Try again" — vermilion outline, transparent
 *   • no avatar, no streak, no progress
 *
 * Sleeping state — if the card's `due` is in the future on mount, we don't
 * surface the question. The reader instead sees a one-line italic dim note
 * so the prose still makes sense as marginalia but doesn't re-quiz them.
 */

type Props = {
  id: string
  question: string
  answer: string
}

type View = 'sleeping' | 'question' | 'answer'

export function RecallCard({ id, question, answer }: Props) {
  // State is initialised on mount to `null` so the server-rendered shape
  // (if SSR were ever added) and the client first paint match — we then
  // hydrate from localStorage in a useEffect. In CSR-only this is still
  // cleaner: a single flicker-free settle into the right view.
  const [card, setCard] = useState<CardState | null>(null)
  const [view, setView] = useState<View>('question')

  useEffect(() => {
    const now = Date.now()
    const existing = getCard(id, now)
    setCard(existing)
    if (existing.lastReviewed > 0 && existing.due > now) {
      setView('sleeping')
    } else {
      setView('question')
    }
  }, [id])

  const handleShow = () => setView('answer')

  const handleOutcome = (outcome: 'got-it' | 'try-again') => {
    const prev = card ?? freshCard(id)
    const next = reschedule(prev, outcome)
    saveCard(next)
    setCard(next)
    setView('sleeping')
  }

  return (
    <aside
      // ~12vh top/bottom margin inside the prose column; hairline rules
      // top + bottom, 1px in fade.
      style={{
        marginTop: '12vh',
        marginBottom: '12vh',
        borderTop: '1px solid var(--color-fade)',
        borderBottom: '1px solid var(--color-fade)',
        paddingTop: '20px',
        paddingBottom: '20px',
      }}
      aria-label="Recall card"
    >
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '11px',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--color-vermilion)',
        }}
      >
        Recall
      </div>

      {view === 'sleeping' && card ? (
        <p
          style={{
            marginTop: '12px',
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: '14px',
            color: 'var(--color-dim)',
          }}
        >
          (Recall card sleeping; due in {daysUntil(card.due)} day
          {daysUntil(card.due) === 1 ? '' : 's'}.)
        </p>
      ) : (
        <>
          <p
            style={{
              marginTop: '12px',
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: '16px',
              color: 'var(--color-ink)',
              lineHeight: 1.5,
            }}
          >
            {question}
          </p>

          {view === 'question' && (
            <div style={{ marginTop: '14px' }}>
              <button
                type="button"
                onClick={handleShow}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: '15px',
                  color: 'var(--color-vermilion)',
                  textDecoration: 'underline',
                  textDecorationThickness: '1px',
                  textUnderlineOffset: '4px',
                }}
              >
                Show answer
              </button>
            </div>
          )}

          {view === 'answer' && (
            <>
              <p
                style={{
                  marginTop: '14px',
                  fontFamily: 'var(--font-serif)',
                  fontSize: '15px',
                  color: 'var(--color-dim)',
                  lineHeight: 1.55,
                }}
              >
                {answer}
              </p>
              <div
                style={{
                  marginTop: '16px',
                  display: 'flex',
                  gap: '10px',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleOutcome('got-it')}
                  style={outlineBtn}
                >
                  Got it
                </button>
                <button
                  type="button"
                  onClick={() => handleOutcome('try-again')}
                  style={outlineBtn}
                >
                  Try again
                </button>
              </div>
            </>
          )}
        </>
      )}
    </aside>
  )
}

const outlineBtn: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--color-vermilion)',
  color: 'var(--color-vermilion)',
  padding: '6px 14px',
  fontFamily: 'var(--font-sans)',
  fontSize: '12px',
  letterSpacing: '0.04em',
  cursor: 'pointer',
  borderRadius: 0,
}

// MDX provider expects a component named just `Recall` — re-export under
// both names so chapter routes can pick either ergonomics.
export { RecallCard as Recall }
