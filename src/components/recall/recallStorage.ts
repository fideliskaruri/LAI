/**
 * SM-2 spaced-repetition scheduler + localStorage adapter.
 *
 * Storage shape — keyed by card id (the `id` prop on a <Recall>):
 *
 *   type CardState = {
 *     id: string
 *     due: number          // ms epoch — when the card next surfaces
 *     interval: number     // days between this review and the next
 *     easeFactor: number   // SM-2 ease factor (starts 2.5)
 *     lastReviewed: number // ms epoch
 *   }
 *
 *   type Store = { [cardId: string]: CardState }
 *
 * Two outcomes only — "got it" (success) and "try again" (failure). This is
 * deliberately reduced from the full SM-2 4-grade ladder; the editorial
 * register doesn't want a four-button judgement panel, and the consumer
 * choice ("did I know it?") is binary.
 *
 * Mapping to SM-2:
 *   got it    → quality 4   (passes; interval grows by easeFactor)
 *   try again → quality 1   (fails; interval resets to 1 day, ease floor 1.3)
 */

export const RECALL_STORAGE_KEY = 'learn-ai:v1:recall'
const MS_PER_DAY = 86_400_000

export type CardState = {
  id: string
  due: number
  interval: number
  easeFactor: number
  lastReviewed: number
}

export type Store = { [cardId: string]: CardState }

/** A brand-new card — due immediately, interval 0, ease at the SM-2 default. */
export function freshCard(id: string, now: number = Date.now()): CardState {
  return {
    id,
    due: now,
    interval: 0,
    easeFactor: 2.5,
    lastReviewed: 0,
  }
}

/** Safe localStorage read — tolerates disabled storage and malformed JSON. */
export function readStore(): Store {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(RECALL_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object') return parsed as Store
    return {}
  } catch {
    return {}
  }
}

export function writeStore(store: Store): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(RECALL_STORAGE_KEY, JSON.stringify(store))
  } catch {
    // private mode or quota — non-fatal
  }
}

export function getCard(id: string, now: number = Date.now()): CardState {
  const store = readStore()
  return store[id] ?? freshCard(id, now)
}

export function saveCard(card: CardState): void {
  const store = readStore()
  store[card.id] = card
  writeStore(store)
}

/**
 * SM-2 reschedule.
 *
 * Standard SM-2:
 *   • on success — new_interval = previous_interval * ease (first review = 1d,
 *     second = 6d, then × ease).
 *   • on failure — interval resets to 1d, ease drops by 0.20 (floor 1.3).
 *
 * `now` is a parameter so tests and the "due indicator" can run determinism.
 */
export function reschedule(
  prev: CardState,
  outcome: 'got-it' | 'try-again',
  now: number = Date.now()
): CardState {
  if (outcome === 'try-again') {
    const easeFactor = Math.max(1.3, prev.easeFactor - 0.2)
    const interval = 1
    return {
      ...prev,
      interval,
      easeFactor,
      lastReviewed: now,
      due: now + interval * MS_PER_DAY,
    }
  }
  // got it — SM-2 first-second-then-×ease ladder
  let interval: number
  if (prev.interval === 0) interval = 1
  else if (prev.interval === 1) interval = 6
  else interval = Math.round(prev.interval * prev.easeFactor)
  return {
    ...prev,
    interval,
    // quality 4: ease delta = 0; leave easeFactor untouched
    easeFactor: prev.easeFactor,
    lastReviewed: now,
    due: now + interval * MS_PER_DAY,
  }
}

/** Number of cards whose due time has elapsed. */
export function dueCount(now: number = Date.now()): number {
  const store = readStore()
  let n = 0
  for (const id in store) {
    if (store[id].due <= now) n += 1
  }
  return n
}

/** Whole-day count rounded up — never returns 0 when a card is in the future. */
export function daysUntil(due: number, now: number = Date.now()): number {
  const ms = due - now
  if (ms <= 0) return 0
  return Math.max(1, Math.ceil(ms / MS_PER_DAY))
}
