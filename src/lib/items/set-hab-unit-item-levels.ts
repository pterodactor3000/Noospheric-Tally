import { DB_FUNCTION_SET_HOUSEHOLD_ITEM_LEVELS } from '../db/entities'

interface HouseholdItemLevels {
  readonly quantity: number
  readonly minimumQuantity: number
}

interface SetHouseholdItemLevelsClient {
  rpc(
    functionName: typeof DB_FUNCTION_SET_HOUSEHOLD_ITEM_LEVELS,
    args: {
      target_item_id: string
      new_quantity: number
      new_minimum_quantity: number
    },
  ): PromiseLike<{
    data: unknown
    error: { message: string } | null
  }>
}

const setHabUnitItemLevels = async (
  itemId: string,
  levels: HouseholdItemLevels,
  client: SetHouseholdItemLevelsClient,
): Promise<void> => {
  const { error } = await client.rpc(DB_FUNCTION_SET_HOUSEHOLD_ITEM_LEVELS, {
    target_item_id: itemId,
    new_quantity: levels.quantity,
    new_minimum_quantity: levels.minimumQuantity,
  })

  if (error) {
    throw new Error(`set_household_item_levels failed for item ${itemId}`, {
      cause: error,
    })
  }
}

export { setHabUnitItemLevels }
export type { HouseholdItemLevels, SetHouseholdItemLevelsClient }
