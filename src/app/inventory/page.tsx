import Link from 'next/link'
import { clsx } from 'clsx'

import { requireCurrentHabUnit, requireCurrentUser } from '@/lib/helpers'
import { loadHabUnitTallyLines } from '@/lib/items/load-hab-unit-items'
import { Button } from '@/components/ui/button'
import { actionButton, centeredPage, panel } from '@/app/styles/class-names'

import InventoryTally from './inventory-tally'

const inventorySection = clsx(
  panel,
  '[width:-webkit-fill-available]',
  '[width:stretch]',
  'max-w-[900px]',
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
        <InventoryTally lines={tallyLines} />
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
