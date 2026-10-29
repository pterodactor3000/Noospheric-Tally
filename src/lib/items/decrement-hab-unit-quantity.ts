import { DB_FUNCTION_DECREMENT_HOUSEHOLD_QUANTITY } from '../db/entities'
import {
  readScanQuantityChange,
  type ScanQuantityChange,
} from './increment-hab-unit-quantity'

interface DecrementHouseholdQuantityClient {
  rpc(
    functionName: typeof DB_FUNCTION_DECREMENT_HOUSEHOLD_QUANTITY,
    args: { item_barcode: string; scan_session_id: string },
  ): PromiseLike<{
    data: unknown
    error: { message: string } | null
  }>
}

const decrementHabUnitQuantity = async (
  itemBarcode: string,
  scanSessionId: string,
  client: DecrementHouseholdQuantityClient,
): Promise<ScanQuantityChange> => {
  const { data, error } = await client.rpc(
    DB_FUNCTION_DECREMENT_HOUSEHOLD_QUANTITY,
    { item_barcode: itemBarcode, scan_session_id: scanSessionId },
  )

  const change = error ? null : readScanQuantityChange(data)
  if (!change) {
    throw new Error(
      `decrement_household_quantity failed for barcode ${itemBarcode}`,
      error ? { cause: error } : undefined,
    )
  }

  return change
}

export { decrementHabUnitQuantity }
export type { DecrementHouseholdQuantityClient }
