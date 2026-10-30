import Link from 'next/link'
import { clsx } from 'clsx'

import { requireCurrentHabUnit, requireCurrentUser } from '@/lib/helpers'
import { loadHabUnitTallyLines } from '@/lib/items/load-hab-unit-items'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { actionButton, centeredPage, panel } from '@/app/styles/class-names'
import { STOCK_STATE_TEXT_CLASS_NAMES } from '@/app/styles/stock-state-class-names'

import InventoryTally from './inventory-tally'

const inventorySection = clsx(
  panel,
  '[width:-webkit-fill-available]',
  '[width:stretch]',
  'max-w-[900px]',
  'flex',
  'min-h-0',
  'flex-col',
  'overflow-y-auto',
  // Signed-in header is py-4, the Sign out control at h-8, and a 2px border.
  // The page adds py-6. The list still scrolls on its own. The section scrolls
  // only when that chrome is taller than a short viewport, so the buttons stay reachable.
  'max-h-[calc(100svh-7rem-2px)]',
)

const inventoryTallyRegion = clsx(
  'flex',
  'min-h-0',
  'flex-1',
  'flex-col',
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

const inventoryActionButton = clsx(actionButton, 'w-full')

const inventoryTitle = clsx('m-0', 'text-center', 'text-2xl', 'font-semibold')

const InventoryPage = async () => {
  await requireCurrentUser()
  const habUnit = await requireCurrentHabUnit()
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
        <Separator className="my-4 h-0.5! shadow-[0_0_8px] shadow-primary/40" />
        <div className={inventoryTallyRegion}>
          <InventoryTally lines={tallyLines} />
        </div>
        <div className={inventoryActions}>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/inventory/new" />}
            className={inventoryActionButton}
          >
            Add item
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/inventory/scan" />}
            className={inventoryActionButton}
          >
            Scan item
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/inventory/restock" />}
            className={inventoryActionButton}
          >
            Restock
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/inventory/lookup" />}
            className={inventoryActionButton}
          >
            Lookup
          </Button>
        </div>
      </section>
    </main>
  )
}

export default InventoryPage
