import Link from 'next/link'

import { requireCurrentHabUnit, requireCurrentUser } from '@/lib/helpers'
import { loadHabUnitItems } from '@/lib/items/load-hab-unit-items'
import { Button } from '@/components/ui/button'
import { actionButton, centeredPage, panel } from '@/app/styles/class-names'

const InventoryPage = async () => {
  await requireCurrentUser()
  const habUnit = await requireCurrentHabUnit()
  const items = await loadHabUnitItems()

  return (
    <main className={centeredPage}>
      <div>
        <h1>Your {habUnit.name} tally</h1>
      </div>

      <section className={panel}>
        {items.length === 0 ? (
          <p>Nothing is added here yet.</p>
        ) : (
          <ul>
            {items.map((item) => (
              <li key={item.itemId}>{item.name}</li>
            ))}
          </ul>
        )}
        <br />
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/inventory/new" />}
          className={actionButton}
        >
          Add item
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/inventory/scan" />}
          className={actionButton}
        >
          Scan item
        </Button>
      </section>
    </main>
  )
}

export default InventoryPage
