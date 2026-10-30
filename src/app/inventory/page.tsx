import Link from 'next/link'
import { clsx } from 'clsx'

import { requireCurrentHabUnit, requireCurrentUser } from '@/lib/helpers'
import { loadHabUnitTallyLines } from '@/lib/items/load-hab-unit-items'
import { STOCK_STATE_LABELS, getStockState } from '@/lib/items/stock-state'
import { Button } from '@/components/ui/button'
import { actionButton, centeredPage, panel } from '@/app/styles/class-names'
import { STOCK_STATE_CLASS_NAMES } from '@/app/styles/stock-state-class-names'

import TallyCountControls from './tally-count-controls'

const TALLY_DOT_LEADER = '.'.repeat(300)

const inventorySection = clsx(
  panel,
  '[width:-webkit-fill-available]',
  '[width:stretch]',
  'max-w-[900px]',
)
const tallyList = clsx('text-[14px]', 'sm:text-[16px]')
const tallyName = clsx('min-h-11', 'min-w-0', 'truncate', 'leading-11')
const tallyDots = clsx(
  'min-w-0',
  'flex-1',
  'overflow-hidden',
  'whitespace-nowrap',
)

const InventoryPage = async () => {
  await requireCurrentUser()
  const habUnit = await requireCurrentHabUnit()
  const tallyLines = await loadHabUnitTallyLines()

  return (
    <main className={centeredPage}>
      <div>
        <h1>Your {habUnit.name} tally</h1>
      </div>

      <section className={inventorySection}>
        {tallyLines.length === 0 ? (
          <p>Nothing is added here yet.</p>
        ) : (
          <ul className={tallyList}>
            {tallyLines.map((line) => {
              const stockState = getStockState(
                line.quantity,
                line.minimumQuantity,
              )

              return (
                <li
                  key={line.itemId}
                  className={clsx('px-2', STOCK_STATE_CLASS_NAMES[stockState])}
                >
                  <TallyCountControls
                    itemId={line.itemId}
                    name={line.name}
                    quantity={line.quantity}
                    stockStateLabel={STOCK_STATE_LABELS[stockState]}
                  >
                    <Link
                      href={`/inventory/${line.itemId}`}
                      className={tallyName}
                    >
                      {line.name}
                    </Link>
                    <span aria-hidden="true" className={tallyDots}>
                      {TALLY_DOT_LEADER}
                    </span>
                  </TallyCountControls>
                </li>
              )
            })}
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
