import { Link } from 'react-router-dom'
import { topics, type Topic } from '../../data/constellation'

/**
 * Mobile fallback for the constellation hub. Vertical list grouped by Part.
 * Atmospheric register is partially lost; that's the accepted trade-off
 * (PLAN §11.2).
 */
export function HubList() {
  const partI = topics.filter((t) => t.part === 'I')
  const partII = topics.filter((t) => t.part === 'II')
  const partIII = topics.filter((t) => t.part === 'III')
  const partIV = topics.filter((t) => t.part === 'IV')

  return (
    <div className="mx-auto max-w-[560px] px-6 pt-12 pb-24">
      <p className="font-sans text-[11px] uppercase tracking-[0.22em] text-dim mb-1">
        An interactive book
      </p>
      <p className="font-serif italic text-[15px] text-dim mb-10">
        A constellation of playgrounds for the math behind machines that learn.
      </p>

      <PartSection numeral="I" name="Foundations" topics={partI} />
      <PartSection numeral="II" name="The first models" topics={partII} />
      <PartSection numeral="III" name="Neural networks" topics={partIII} />
      <PartSection numeral="IV" name="The frontier" topics={partIV} />
    </div>
  )
}

interface PartSectionProps {
  numeral: string
  name: string
  topics: Topic[]
}

function PartSection({ numeral, name, topics }: PartSectionProps) {
  return (
    <section className="mb-12">
      <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-dim mb-1">
        Part&nbsp;&nbsp;{numeral}
      </p>
      <h2 className="font-serif text-[22px] text-ink mb-5">{name}</h2>
      <ul className="space-y-3">
        {topics.map((t) => (
          <li key={t.id}>
            {t.status === 'available' ? (
              <Link
                to={`/${t.id}`}
                className="flex items-baseline gap-4 group"
              >
                <span className="font-serif tabular-nums text-[13px] w-7 text-vermilion shrink-0">
                  {String(t.number).padStart(2, '0')}
                </span>
                <span className="font-serif text-[17px] text-ink group-hover:underline group-hover:decoration-vermilion underline-offset-4">
                  {t.name}
                </span>
              </Link>
            ) : (
              <div className="flex items-baseline gap-4">
                <span className="font-serif tabular-nums text-[13px] w-7 text-fade shrink-0">
                  {String(t.number).padStart(2, '0')}
                </span>
                <span className="font-serif text-[17px] text-fade">{t.name}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
