import { clsx } from 'clsx'
import { ReactNode } from 'react'

import { validateBarcode } from '@/lib/items/validate-barcode'
import { requireCurrentHabUnit, requireCurrentUser } from '@/lib/helpers'
import { findGlobalItemByBarcode } from '@/lib/items/find-global-item-by-barcode'
import { loadHabUnitItemByBarcode } from '@/lib/items/load-hab-unit-item-by-barcode'
import { loadHabUnitItems } from '@/lib/items/load-hab-unit-items'

import { AlreadyStocked } from './already-stocked'
import { AddToHabUnitForm } from './add-to-hab-unit-form'
import { BarcodeLookupForm } from './barcode-lookup-form'
import { ItemCreateForm } from './item-create-form'
import { lookupCatalogName } from '@/lib/catalog/lookup-catalog-name'

const NewItemPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ barcode?: string | string[] }>
}) => {
  await requireCurrentUser()
  await requireCurrentHabUnit()

  const params = await searchParams
  const rawBarcode = typeof params.barcode === 'string' ? params.barcode : ''
  const validationResult = rawBarcode ? validateBarcode(rawBarcode) : null
  const barcode =
    validationResult?.status === 'valid' ? validationResult.barcode : null

  let body: ReactNode

  if (!barcode) {
    body = (
      <BarcodeLookupForm
        defaultBarcode={rawBarcode}
        errorMessage={
          validationResult?.status === 'invalid'
            ? validationResult.message
            : undefined
        }
      />
    )
  } else {
    const habUnitItem = await loadHabUnitItemByBarcode(barcode)

    if (habUnitItem) {
      body = <AlreadyStocked name={habUnitItem.name} />
    } else {
      const globalItem = await findGlobalItemByBarcode(barcode)

      if (globalItem) {
        body = (
          <AddToHabUnitForm
            itemId={globalItem.itemId}
            canonicalName={globalItem.name}
          />
        )
      } else {
        const [lookupProduct, items] = await Promise.all([
          lookupCatalogName(barcode),
          loadHabUnitItems(),
        ])
        const defaultName =
          lookupProduct.status === 'found' ? lookupProduct.name : ''

        body = (
          <ItemCreateForm
            barcode={barcode}
            habUnitItems={items}
            defaultName={defaultName}
          />
        )
      }
    }
  }

  return (
    <main
      className={clsx(
        'flex',
        'min-h-screen',
        'items-center',
        'bg-background',
        'px-6',
        'py-12',
        'text-foreground',
        'sm:px-10',
      )}
    >
      <div className={clsx('mx-auto', 'w-full', 'max-w-4xl')}>
        <div
          className={clsx(
            'border',
            'border-foreground/50',
            'p-8',
            'shadow-sm',
            'backdrop-blur',
            'sm:p-12',
            'dark:bg-black/20',
          )}
        >
          {body}
        </div>
      </div>
    </main>
  )
}

export default NewItemPage
