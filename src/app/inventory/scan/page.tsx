import { redirect } from 'next/navigation'

import { requireCurrentHabUnit, requireCurrentUser } from '@/lib/helpers'
import { loadHabUnitItemByBarcode } from '@/lib/items/load-hab-unit-item-by-barcode'
import {
  SCAN_DIRECTION_STOCKING,
  SCAN_DIRECTION_USING,
  resolveScanDisplay,
  type ScanDirection,
} from '@/lib/items/scan-direction'
import { validateBarcode } from '@/lib/items/validate-barcode'

import { ScanCapture } from './scan-capture'

type SearchParamValue = string | string[] | undefined

const readDirectionParam = (value: SearchParamValue): ScanDirection =>
  value === SCAN_DIRECTION_STOCKING
    ? SCAN_DIRECTION_STOCKING
    : SCAN_DIRECTION_USING

const ScanItemPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    barcode?: SearchParamValue
    direction?: SearchParamValue
    added?: SearchParamValue
  }>
}) => {
  await requireCurrentUser()
  await requireCurrentHabUnit()

  const params = await searchParams
  const rawBarcode = typeof params.barcode === 'string' ? params.barcode : ''

  if (!rawBarcode) {
    return <ScanCapture />
  }

  const validationResult = validateBarcode(rawBarcode)

  if (validationResult.status === 'invalid') {
    return (
      <ScanCapture
        defaultBarcode={rawBarcode}
        errorMessage={validationResult.message}
      />
    )
  }

  const barcode = validationResult.barcode
  const habUnitItem = await loadHabUnitItemByBarcode(barcode)
  const display = resolveScanDisplay(
    readDirectionParam(params.direction),
    habUnitItem,
  )

  if (display.status === 'create') {
    redirect(`/inventory/new?barcode=${encodeURIComponent(barcode)}`)
  }

  if (display.status === 'name') {
    return (
      <ScanCapture
        key={barcode}
        holdBarcode={barcode}
        scanResult={{
          title: 'Already stocked',
          detail: display.name,
        }}
      />
    )
  }

  const didAddItem = params.added === '1'

  return (
    <ScanCapture
      key={barcode}
      holdBarcode={barcode}
      scanResult={{
        title: display.name,
        detail: String(display.quantity),
        confirmation: didAddItem
          ? `Item ${display.name} ${barcode} was added to inventory.`
          : undefined,
        shouldClearAdded: didAddItem,
      }}
    />
  )
}

export default ScanItemPage
