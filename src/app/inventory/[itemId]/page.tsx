import { clsx } from 'clsx'
import { notFound } from 'next/navigation'

import { requireCurrentHabUnit, requireCurrentUser } from '@/lib/helpers'
import { loadHabUnitItemById } from '@/lib/items/load-hab-unit-item-by-id'
import { loadItemBarcode } from '@/lib/items/load-item-barcode'
import { isScanSessionId } from '@/lib/items/scan-session'
import { getStockState, STOCK_STATE_LABELS } from '@/lib/items/stock-state'
import { centeredPage, panel } from '@/app/styles/class-names'
import { STOCK_STATE_TEXT_CLASS_NAMES } from '@/app/styles/stock-state-class-names'

import ItemMinimumForm from './item-minimum-form'
import TallyCountControls from '../tally-count-controls'

const itemSection = clsx(
  panel,
  '[width:-webkit-fill-available]',
  '[width:stretch]',
  'max-w-[900px]',
)
const itemCount = clsx('mt-6')

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

  const barcode = await loadItemBarcode(item.itemId)
  const stockState = getStockState(item.quantity, item.minimumQuantity)

  return (
    <main className={centeredPage}>
      <section className={itemSection}>
        <h1>
          <span
            className={clsx(
              'font-bold',
              STOCK_STATE_TEXT_CLASS_NAMES[stockState],
            )}
          >
            [{STOCK_STATE_LABELS[stockState]}]
          </span>{' '}
          {item.name}
          {barcode === null ? null : ` ++  ${barcode} ++`}
        </h1>
        <div className={itemCount}>
          <TallyCountControls
            itemId={item.itemId}
            name={item.name}
            quantity={item.quantity}
            stockStateLabel={STOCK_STATE_LABELS[stockState]}
            stockTextClassName=""
          >
            <span>Count</span>
          </TallyCountControls>
          <p>Minimum: {item.minimumQuantity}</p>
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
