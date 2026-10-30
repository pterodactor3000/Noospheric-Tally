import { DB_FUNCTION_SET_HOUSEHOLD_MINIMUM_QUANTITY } from '../db/entities'

interface SetHouseholdMinimumQuantityClient {
  rpc(
    functionName: typeof DB_FUNCTION_SET_HOUSEHOLD_MINIMUM_QUANTITY,
    args: { target_item_id: string; new_minimum_quantity: number },
  ): PromiseLike<{
    data: unknown
    error: { message: string } | null
  }>
}

const setHabUnitMinimumQuantity = async (
  itemId: string,
  minimumQuantity: number,
  client: SetHouseholdMinimumQuantityClient,
): Promise<number> => {
  const { data, error } = await client.rpc(
    DB_FUNCTION_SET_HOUSEHOLD_MINIMUM_QUANTITY,
    { target_item_id: itemId, new_minimum_quantity: minimumQuantity },
  )

  if (error || typeof data !== 'number' || !Number.isInteger(data)) {
    throw new Error(
      `set_household_minimum_quantity failed for item ${itemId}`,
      error ? { cause: error } : undefined,
    )
  }

  return data
}

export { setHabUnitMinimumQuantity }
export type { SetHouseholdMinimumQuantityClient }
