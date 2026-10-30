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
    <main className={centeredPage}>
      <section className={inventorySection}>
        <h1 className={inventoryTitle}>
          <span className={STOCK_STATE_TEXT_CLASS_NAMES['in-stock']}>
            [{habUnit.name}]
          </span>{' '}
          tally
        </h1>
        <Separator className="my-4 h-0.5! shadow-[0_0_8px] shadow-primary/40" />
        <InventoryTally lines={tallyLines} />
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
            className={clsx(inventoryActionButton, 'col-span-2')}
          >
            Restock
          </Button>
        </div>
      </section>
    </main>
  )
}

export default InventoryPage
