import { DB_FUNCTION_INCREMENT_HOUSEHOLD_QUANTITY } from '../db/entities'
import { NUMERIC_VALUE_OUT_OF_RANGE_ERROR_CODE } from './reverse-quantity-change'

interface ScanQuantityChange {
  readonly changeId: string
  readonly quantity: number
}

interface IncrementedHabUnitQuantity {
  readonly status: 'incremented'
  readonly changeId: string
  readonly quantity: number
}

interface AboveMaximumHabUnitQuantity {
  readonly status: 'above-maximum'
}

type IncrementHabUnitQuantityResult =
  | IncrementedHabUnitQuantity
  | AboveMaximumHabUnitQuantity

interface IncrementHouseholdQuantityClient {
  rpc(
    functionName: typeof DB_FUNCTION_INCREMENT_HOUSEHOLD_QUANTITY,
    args: { item_barcode: string; scan_session_id: string },
  ): PromiseLike<{
    data: unknown
    error: { message: string; code?: string } | null
  }>
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readScanQuantityChange = (data: unknown): ScanQuantityChange | null => {
  if (!Array.isArray(data) || data.length !== 1) {
    return null
  }

  const row: unknown = data[0]
  if (!isRecord(row)) {
    return null
  }

  const { change_id: changeId, quantity } = row
  if (typeof changeId !== 'string' || typeof quantity !== 'number') {
    return null
  }

  return { changeId, quantity }
}

const incrementHabUnitQuantity = async (
  itemBarcode: string,
  scanSessionId: string,
  client: IncrementHouseholdQuantityClient,
): Promise<IncrementHabUnitQuantityResult> => {
  const { data, error } = await client.rpc(
    DB_FUNCTION_INCREMENT_HOUSEHOLD_QUANTITY,
    { item_barcode: itemBarcode, scan_session_id: scanSessionId },
  )

  if (error?.code === NUMERIC_VALUE_OUT_OF_RANGE_ERROR_CODE) {
    return { status: 'above-maximum' }
  }

  const change = error ? null : readScanQuantityChange(data)
  if (!change) {
    throw new Error(
      `increment_household_quantity failed for barcode ${itemBarcode}`,
      error ? { cause: error } : undefined,
    )
  }

  return {
    status: 'incremented',
    changeId: change.changeId,
    quantity: change.quantity,
  }
}

export { incrementHabUnitQuantity, readScanQuantityChange }
export type { IncrementHouseholdQuantityClient, ScanQuantityChange }
