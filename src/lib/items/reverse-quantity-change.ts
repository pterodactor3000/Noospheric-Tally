import { DB_FUNCTION_REVERSE_QUANTITY_CHANGE } from '../db/entities'

// SQLSTATE check_violation. reverse_quantity_change raises it for a below-0 result.
const CHECK_VIOLATION_ERROR_CODE = '23514'

// SQLSTATE numeric_value_out_of_range.
const NUMERIC_VALUE_OUT_OF_RANGE_ERROR_CODE = '22003'

interface ReverseQuantityChangeClient {
  rpc(
    functionName: typeof DB_FUNCTION_REVERSE_QUANTITY_CHANGE,
    args: { change_id: string },
  ): PromiseLike<{
    data: unknown
    error: { message: string; code?: string } | null
  }>
}

interface ReversedQuantityChange {
  readonly status: 'reversed'
  readonly quantity: number
}

interface BelowZeroQuantityChange {
  readonly status: 'below-zero'
}

interface AboveMaximumQuantityChange {
  readonly status: 'above-maximum'
}

type ReverseQuantityChangeResult =
  | ReversedQuantityChange
  | BelowZeroQuantityChange
  | AboveMaximumQuantityChange

const reverseQuantityChange = async (
  changeId: string,
  client: ReverseQuantityChangeClient,
): Promise<ReverseQuantityChangeResult> => {
  const { data, error } = await client.rpc(
    DB_FUNCTION_REVERSE_QUANTITY_CHANGE,
    { change_id: changeId },
  )

  if (error?.code === CHECK_VIOLATION_ERROR_CODE) {
    return { status: 'below-zero' }
  }

  if (error?.code === NUMERIC_VALUE_OUT_OF_RANGE_ERROR_CODE) {
    return { status: 'above-maximum' }
  }

  if (error || typeof data !== 'number') {
    throw new Error(
      `reverse_quantity_change failed for change ${changeId}`,
      error ? { cause: error } : undefined,
    )
  }

  return { status: 'reversed', quantity: data }
}

export {
  CHECK_VIOLATION_ERROR_CODE,
  NUMERIC_VALUE_OUT_OF_RANGE_ERROR_CODE,
  reverseQuantityChange,
}
export type { ReverseQuantityChangeClient, ReverseQuantityChangeResult }
