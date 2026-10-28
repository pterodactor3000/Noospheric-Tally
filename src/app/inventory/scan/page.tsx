import { redirect } from 'next/navigation'
import Link from 'next/link'

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
import { StockedCount } from './stocked-count'
import { StockedToast } from './stocked-toast'
import { AlreadyStocked } from '../new/already-stocked'

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
      <>
        <AlreadyStocked name={display.name} />
        <ScanCapture key={barcode} />
        <Link href="/inventory">Back to inventory</Link>
      </>
    )
  }

  return (
    <>
      <StockedCount name={display.name} quantity={display.quantity} />
      <StockedToast
        name={display.name}
        barcode={barcode}
        show={params.added === '1'}
      />
      <ScanCapture key={barcode} holdBarcode={barcode} />
      <Link href="/inventory">Back to inventory</Link>
    </>
  )
}

export default ScanItemPage
