import { clsx } from 'clsx'

import { requireCurrentHabUnit, requireCurrentUser } from '@/lib/helpers'
import { loadHabUnitTallyLines } from '@/lib/items/load-hab-unit-items'
import { rankRestockLines } from '@/lib/items/rank-restock-lines'
import { Separator } from '@/components/ui/separator'
import { centeredPage, panel } from '@/app/styles/class-names'

import { RestockList } from './restock-list'

const restockSection = clsx(
  panel,
  '[width:-webkit-fill-available]',
  '[width:stretch]',
  'max-w-[900px]',
)

const restockTitle = clsx('m-0', 'text-center', 'text-2xl', 'font-semibold')

const RestockPage = async () => {
  await requireCurrentUser()
  await requireCurrentHabUnit()
  const tallyLines = await loadHabUnitTallyLines()
  const restockLines = rankRestockLines(tallyLines)

  return (
    <main className={centeredPage}>
      <section className={restockSection}>
        <h1 className={restockTitle}>Restock</h1>
        <Separator className="my-4 h-0.5! shadow-[0_0_8px] shadow-primary/40" />
        <RestockList lines={restockLines} />
      </section>
    </main>
  )
}

export default RestockPage
