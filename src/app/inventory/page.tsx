import Link from 'next/link'
import { clsx } from 'clsx'

import { requireCurrentHabUnit, requireCurrentUser } from '@/lib/helpers'
import { loadHabUnitItems } from '@/lib/items/load-hab-unit-items'
import { Button } from '@/components/ui/button'
import { CSSProperties } from 'react'

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
      <div>
        <h1>Your {habUnit.name} tally</h1>
      </div>

      <section
        className={clsx(
          'border',
          'border-foreground/50',
          'rounded-br-4xl',
          'p-8',
          'shadow-sm',
          'backdrop-blur',
          'sm:p-12',
          'dark:bg-black/20',
        )}
        style={{ cornerShape: 'bevel' } as CSSProperties}
      >
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
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/inventory/scan" />}
          className={clsx('font-mono', 'min-h-11')}
        >
          Scan item
        </Button>
      </section>
    </main>
  )
}

export default InventoryPage
