import Link from 'next/link'
import { clsx } from 'clsx'

import { requireCurrentHabUnit, requireCurrentUser } from '@/lib/helpers'
import { loadHabUnitItems } from '@/lib/items/load-hab-unit-items'
import { Button } from '@/components/ui/button'

const InventoryPage = async () => {
  await requireCurrentUser()
  const habUnit = await requireCurrentHabUnit()
  const items = await loadHabUnitItems()

  return (
    <main
      className={clsx(
        'flex',
        'flex-col',
        'min-h-screen',
        'items-center',
        'justify-center',
        'px-6',
      )}
    >
      <p>Your {habUnit.name} tally</p>
      <br />
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
        className={clsx('font-mono', 'min-h-11')}
      >
        Add item
      </Button>
    </main>
  )
}

export default InventoryPage
