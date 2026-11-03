import Link from 'next/link'
import { clsx } from 'clsx'

import { requireCurrentHabUnit, requireCurrentUser } from '@/lib/helpers'
import { loadHabUnitCategories } from '@/lib/items/load-hab-unit-categories'
import { loadHabUnitTallyLines } from '@/lib/items/load-hab-unit-items'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { centeredPage } from '@/app/styles/class-names'
import { STOCK_STATE_TEXT_CLASS_NAMES } from '@/app/styles/stock-state-class-names'

import InventoryTally from './inventory-tally'

const inventorySection = clsx(
  '[width:-webkit-fill-available]',
  '[width:stretch]',
  'flex',
  'min-h-0',
  'flex-col',
  'overflow-y-auto',
  'px-1',
  // Signed-in header is py-4, the Sign out control at h-8, and a 2px border.
  // The page adds py-6. The list still scrolls on its own. The section scrolls
  // only when that chrome is taller than a short viewport, so the buttons stay reachable.
  'max-h-[calc(100svh-7rem-2px)]',
)

const inventoryActions = clsx(
  'mx-auto',
  'mt-4',
  'grid',
  'w-full',
  'max-w-lg',
  'grid-cols-2',
  'gap-4',
)

const inventoryTitle = clsx('m-0', 'text-center', 'text-2xl', 'font-semibold')

const InventoryPage = async () => {
  await requireCurrentUser()
  const habUnit = await requireCurrentHabUnit()
  const customCategories = await loadHabUnitCategories()
  const tallyLines = await loadHabUnitTallyLines()

  return (
    <main className={clsx(centeredPage, 'py-6')}>
      <section className={inventorySection}>
        <h1 className={inventoryTitle}>
          <span className={STOCK_STATE_TEXT_CLASS_NAMES['in-stock']}>
            [{habUnit.name}]
          </span>{' '}
          tally
        </h1>
        <Separator variant="heading" />
        <InventoryTally
          lines={tallyLines}
          customCategories={customCategories}
        />
        <div className={inventoryActions}>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/inventory/new" />}
            size="touch"
          >
            Add item
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/inventory/scan" />}
            size="touch"
          >
            Scan item
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/inventory/restock" />}
            size="touch"
          >
            Restock
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/inventory/lookup" />}
            size="touch"
          >
            Lookup
          </Button>
        </div>
        <div className={clsx('mt-2', 'flex', 'justify-center')}>
          <Button
            variant="link"
            nativeButton={false}
            render={<Link href="/hab-unit/share" />}
          >
            Share hab unit
          </Button>
        </div>
      </section>
    </main>
  )
}

export default InventoryPage
