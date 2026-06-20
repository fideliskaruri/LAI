import { Constellation } from '../components/hub/Constellation'
import { HubList } from '../components/hub/HubList'

/**
 * Mobile (< 900px): vertical Part-grouped list. Desktop: constellation.
 * Switch is enforced via CSS — only one renders per viewport.
 */
export function Hub() {
  return (
    <main>
      <div className="hidden md:block">
        <Constellation />
      </div>
      <div className="block md:hidden">
        <HubList />
      </div>
    </main>
  )
}
