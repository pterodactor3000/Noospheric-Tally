import { clsx } from 'clsx'

import { requireCurrentHabUnit, requireCurrentUser } from '@/lib/helpers'
import { loadHabUnitCategories } from '@/lib/items/load-hab-unit-categories'
import { loadHabUnitTallyLines } from '@/lib/items/load-hab-unit-items'
import { rankRestockLines } from '@/lib/items/rank-restock-lines'
import { Separator } from '@/components/ui/separator'
import { centeredPage } from '@/app/styles/class-names'

import { RestockList } from './restock-list'

const restockSection = clsx(
  'w-full',
  '[width:-webkit-fill-available]',
  '[width:stretch]',
)

const restockTitle = clsx('m-0', 'text-center', 'text-2xl', 'font-semibold')

const RestockPage = async () => {
  await requireCurrentUser()
  await requireCurrentHabUnit()
  const customCategories = await loadHabUnitCategories()
  const tallyLines = await loadHabUnitTallyLines()
  const restockLines = rankRestockLines(tallyLines)

  return (
    <main className={centeredPage}>
      <section className={restockSection}>
        <h1 className={restockTitle}>Restock</h1>
        <Separator variant="heading" />
        <RestockList
          lines={restockLines}
          customCategories={customCategories}
        />
      </section>
    </main>
  )
}

export default RestockPage
