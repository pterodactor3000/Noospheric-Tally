import { clsx } from 'clsx'
import { notFound } from 'next/navigation'

import { requireCurrentHabUnit, requireCurrentUser } from '@/lib/helpers'
import { loadHabUnitItemById } from '@/lib/items/load-hab-unit-item-by-id'
import { isScanSessionId } from '@/lib/items/scan-session'
import { getStockState, STOCK_STATE_LABELS } from '@/lib/items/stock-state'
import { centeredPage, panel } from '@/app/styles/class-names'
import { STOCK_STATE_CLASS_NAMES } from '@/app/styles/stock-state-class-names'

import ItemMinimumForm from './item-minimum-form'

const itemSection = clsx(
  panel,
  '[width:-webkit-fill-available]',
  '[width:stretch]',
  'max-w-[900px]',
)
const stockBlock = clsx('mt-6', 'p-4', 'font-mono', 'font-semibold')

const ItemPage = async ({ params }: PageProps<'/inventory/[itemId]'>) => {
  await requireCurrentUser()
  await requireCurrentHabUnit()

  const { itemId } = await params

  if (!isScanSessionId(itemId)) {
    notFound()
  }

  const item = await loadHabUnitItemById(itemId)

  if (!item) {
    notFound()
  }

  const stockState = getStockState(item.quantity, item.minimumQuantity)

  return (
    <main className={centeredPage}>
      <section className={itemSection}>
        <h1>{item.name}</h1>
        <div className={clsx(stockBlock, STOCK_STATE_CLASS_NAMES[stockState])}>
          <p>Count: {item.quantity}</p>
          <p>Minimum: {item.minimumQuantity}</p>
          <p>{STOCK_STATE_LABELS[stockState]}</p>
        </div>
        <ItemMinimumForm
          itemId={item.itemId}
          minimumQuantity={item.minimumQuantity}
        />
      </section>
    </main>
  )
}

export default ItemPage
