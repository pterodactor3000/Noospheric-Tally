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

import { ScanCapture, type ScanCaptureResult } from './scan-capture'

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
    removed?: SearchParamValue
    floor?: SearchParamValue
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
  const direction = readDirectionParam(params.direction)
  const display = resolveScanDisplay(direction, habUnitItem)

  if (display.status === 'create') {
    redirect(`/inventory/new?barcode=${encodeURIComponent(barcode)}`)
  }

  let clearParam: ScanCaptureResult['clearParam']
  let confirmation: string | undefined

  if (direction === SCAN_DIRECTION_STOCKING && params.added === '1') {
    clearParam = 'added'
    confirmation = `Item ${display.name} ${barcode} was added to inventory.`
  } else if (direction === SCAN_DIRECTION_USING && params.removed === '1') {
    clearParam = 'removed'
    confirmation = `Item ${display.name} ${barcode} was removed from inventory.`
  } else if (direction === SCAN_DIRECTION_USING && params.floor === '1') {
    clearParam = 'floor'
    confirmation = `Item ${display.name} ${barcode} is already at 0.`
  }

  return (
    <ScanCapture
      key={barcode}
      holdBarcode={barcode}
      scanResult={{
        title: display.name,
        detail: String(display.quantity),
        confirmation,
        clearParam,
      }}
    />
  )
}

export default ScanItemPage
