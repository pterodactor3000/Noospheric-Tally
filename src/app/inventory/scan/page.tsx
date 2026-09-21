import { redirect } from 'next/navigation'
import Link from 'next/link'

import { requireCurrentHabUnit, requireCurrentUser } from '@/lib/helpers'
import { loadHabUnitItemByBarcode } from '@/lib/items/load-hab-unit-item-by-barcode'
import { validateBarcode } from '@/lib/items/validate-barcode'

import { ScanCapture } from './scan-capture'
import { AlreadyStocked } from '../new/already-stocked'

const ScanItemPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ barcode?: string | string[] }>
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
    return <ScanCapture />
  }

  const barcode = validationResult.barcode
  const habUnitItem = await loadHabUnitItemByBarcode(barcode)

  if (!habUnitItem) {
    redirect(`/inventory/new?barcode=${encodeURIComponent(barcode)}`)
  }

  return (
    <>
      <AlreadyStocked name={habUnitItem.name} />
      <Link href="/inventory">Back to inventory</Link>
    </>
  )
}

export default ScanItemPage
