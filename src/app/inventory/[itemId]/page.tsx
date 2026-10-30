import { clsx } from 'clsx'
import { notFound } from 'next/navigation'

import { requireCurrentHabUnit, requireCurrentUser } from '@/lib/helpers'
import { loadHabUnitItemById } from '@/lib/items/load-hab-unit-item-by-id'
import { loadItemBarcodes } from '@/lib/items/load-item-barcodes'
import { isScanSessionId } from '@/lib/items/scan-session'
import { centeredPage, panel } from '@/app/styles/class-names'

import { ItemLevelEditor } from './item-level-editor'

const itemSection = clsx(
  panel,
  'min-w-0',
  '[width:-webkit-fill-available]',
  '[width:stretch]',
  'max-w-[900px]',
)

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

  const barcodes = await loadItemBarcodes(item.itemId)

  return (
    <main className={centeredPage}>
      <section className={itemSection}>
        <ItemLevelEditor
          itemId={item.itemId}
          name={item.name}
          quantity={item.quantity}
          minimumQuantity={item.minimumQuantity}
          barcodes={barcodes}
        />
      </section>
    </main>
  )
}

export default ItemPage
