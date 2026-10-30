import { clsx } from 'clsx'

import { requireCurrentHabUnit, requireCurrentUser } from '@/lib/helpers'
import { loadHabUnitTallyLines } from '@/lib/items/load-hab-unit-items'
import { rankRestockLines } from '@/lib/items/rank-restock-lines'
import { centeredPage, panel } from '@/app/styles/class-names'

import { RestockList } from './restock-list'

const restockSection = clsx(
  panel,
  '[width:-webkit-fill-available]',
  '[width:stretch]',
  'max-w-[900px]',
)

const restockTitle = clsx('mb-[1rem]', 'text-center', 'text-2xl', 'font-semibold')

const RestockPage = async () => {
  await requireCurrentUser()
  await requireCurrentHabUnit()
  const tallyLines = await loadHabUnitTallyLines()
  const restockLines = rankRestockLines(tallyLines)

  return (
    <main className={centeredPage}>
      <h1 className={restockTitle}>Restock</h1>
      <section className={restockSection}>
        <RestockList lines={restockLines} />
      </section>
    </main>
  )
}

export default RestockPage
