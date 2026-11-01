import { DB_FUNCTION_HIDE_HOUSEHOLD_ITEM } from '../db/entities'

interface HideHouseholdItemClient {
  rpc(
    functionName: typeof DB_FUNCTION_HIDE_HOUSEHOLD_ITEM,
    args: { target_item_id: string },
  ): PromiseLike<{
    data: unknown
    error: { message: string } | null
  }>
}

const hideHabUnitItem = async (
  itemId: string,
  client: HideHouseholdItemClient,
): Promise<void> => {
  const { error } = await client.rpc(DB_FUNCTION_HIDE_HOUSEHOLD_ITEM, {
    target_item_id: itemId,
  })

  if (error) {
    throw new Error(`hide_household_item failed for item ${itemId}`, {
      cause: error,
    })
  }
}

export { hideHabUnitItem }
export type { HideHouseholdItemClient }
