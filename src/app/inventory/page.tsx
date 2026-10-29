import Link from 'next/link'
import { clsx } from 'clsx'

import { requireCurrentHabUnit, requireCurrentUser } from '@/lib/helpers'
import { loadHabUnitTallyLines } from '@/lib/items/load-hab-unit-items'
import { Button } from '@/components/ui/button'
import { actionButton, centeredPage, panel } from '@/app/styles/class-names'

const TALLY_DOT_LEADER = '.'.repeat(300)

const inventorySection = clsx(
  panel,
  '[width:-webkit-fill-available]',
  '[width:stretch]',
  'max-w-[900px]',
)
const tallyList = clsx('text-[14px]', 'sm:text-[16px]')
const tallyRow = clsx('flex', 'items-baseline', 'gap-2')
const tallyName = clsx('min-w-0', 'truncate')
const tallyDots = clsx(
  'min-w-0',
  'flex-1',
  'overflow-hidden',
  'whitespace-nowrap',
)
const tallyCount = clsx('shrink-0', 'whitespace-nowrap')
const tallyControl = clsx(
  'cursor-pointer',
  'border-0',
  'bg-transparent',
  'p-0',
  'font-[inherit]',
  'text-[length:inherit]',
  'leading-[inherit]',
  'text-inherit',
  'no-underline',
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
            {tallyLines.map((line) => (
              <li key={line.itemId} className={tallyRow}>
                <span className={tallyName}>{line.name}</span>
                <span aria-hidden="true" className={tallyDots}>
                  {TALLY_DOT_LEADER}
                </span>
                <span className={tallyCount}>
                  <button
                    type="button"
                    aria-label={`Decrease ${line.name}`}
                    className={tallyControl}
                  >
                    [-]
                  </button>{' '}
                  {line.quantity}{' '}
                  <button
                    type="button"
                    aria-label={`Increase ${line.name}`}
                    className={tallyControl}
                  >
                    [+]
                  </button>
                </span>
              </li>
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
