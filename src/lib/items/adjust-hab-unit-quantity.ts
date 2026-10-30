import { DB_FUNCTION_ADJUST_HOUSEHOLD_QUANTITY } from '../db/entities'
import { CHECK_VIOLATION_ERROR_CODE } from './reverse-quantity-change'
import type { QuantityAdjustment } from './quantity-adjustment'

interface AdjustHouseholdQuantityClient {
  rpc(
    functionName: typeof DB_FUNCTION_ADJUST_HOUSEHOLD_QUANTITY,
    args: { target_item_id: string; delta_quantity: number },
  ): PromiseLike<{
    data: unknown
    error: { message: string; code?: string } | null
  }>
}

interface AdjustedHabUnitQuantity {
  readonly status: 'adjusted'
  readonly quantity: number
}

interface BelowZeroHabUnitQuantity {
  readonly status: 'below-zero'
}

type AdjustHabUnitQuantityResult =
  | AdjustedHabUnitQuantity
  | BelowZeroHabUnitQuantity

const isIntegerQuantity = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value)

const adjustHabUnitQuantity = async (
  itemId: string,
  deltaQuantity: QuantityAdjustment,
  client: AdjustHouseholdQuantityClient,
): Promise<AdjustHabUnitQuantityResult> => {
  const { data, error } = await client.rpc(
    DB_FUNCTION_ADJUST_HOUSEHOLD_QUANTITY,
    { target_item_id: itemId, delta_quantity: deltaQuantity },
  )

  if (error?.code === CHECK_VIOLATION_ERROR_CODE) {
    return { status: 'below-zero' }
  }

  if (error || !isIntegerQuantity(data)) {
    throw new Error(
      `adjust_household_quantity failed for item ${itemId}`,
      error ? { cause: error } : undefined,
    )
  }

  return { status: 'adjusted', quantity: data }
}

export { adjustHabUnitQuantity }
export type { AdjustHabUnitQuantityResult, AdjustHouseholdQuantityClient }
