import { requireCurrentHabUnit, requireCurrentUser } from '@/lib/helpers'
import {
  loadHabUnitItemByBarcode,
  type HabUnitStockedItem,
} from '@/lib/items/load-hab-unit-item-by-barcode'
import { resolveLookupDisplay } from '@/lib/items/resolve-lookup-display'
import { validateBarcode } from '@/lib/items/validate-barcode'

import { LookupCapture } from './lookup-capture'

type SearchParamValue = string | string[] | undefined

const LOOKUP_FAILURE_MESSAGE =
  'The hab unit lookup failed. Try the scan again.'

const LookupPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    barcode?: SearchParamValue
  }>
}) => {
  await requireCurrentUser()
  await requireCurrentHabUnit()

  const params = await searchParams
  const rawBarcode = typeof params.barcode === 'string' ? params.barcode : ''

  if (!rawBarcode) {
    return <LookupCapture />
  }

  const validationResult = validateBarcode(rawBarcode)

  if (validationResult.status === 'invalid') {
    return (
      <LookupCapture
        defaultBarcode={rawBarcode}
        errorMessage={validationResult.message}
      />
    )
  }

  const barcode = validationResult.barcode
  let habUnitItem: HabUnitStockedItem | null

  try {
    habUnitItem = await loadHabUnitItemByBarcode(barcode)
  } catch (error: unknown) {
    console.error(
      new Error(
        `loadHabUnitItemByBarcode failed for barcode ${barcode}`,
        error ? { cause: error } : undefined,
      ),
    )

    return (
      <LookupCapture
        holdBarcode={barcode}
        failureMessage={LOOKUP_FAILURE_MESSAGE}
      />
    )
  }

  return (
    <LookupCapture
      holdBarcode={barcode}
      display={resolveLookupDisplay(habUnitItem)}
    />
  )
}

export default LookupPage
