import { DB_FUNCTION_SET_HOUSEHOLD_ITEM_LEVELS } from '../db/entities'
import { getCategoryRpcArgs, type ItemCategoryRef } from './item-category-ref'

// SQLSTATE serialization_failure. set_household_item_levels raises it for a stale count or category.
// A saved decrease writes one household_quantity_changes row per unit removed.
// A raise, a minimum-only save, and a category-only save write none.
const STALE_QUANTITY_ERROR_CODE = '40001'

interface HouseholdItemLevels {
  readonly quantity: number
  readonly minimumQuantity: number
  readonly expectedQuantity: number
  readonly expectedCategory: ItemCategoryRef
  readonly category: ItemCategoryRef
}

interface SetHouseholdItemLevelsClient {
  rpc(
    functionName: typeof DB_FUNCTION_SET_HOUSEHOLD_ITEM_LEVELS,
    args: {
      target_item_id: string
      new_quantity: number
      new_minimum_quantity: number
      expected_quantity: number
      expected_category: string | null
      expected_custom_category_id: string | null
      new_category: string | null
      new_custom_category_id: string | null
    },
  ): PromiseLike<{
    data: unknown
    error: { message: string; code?: string } | null
  }>
}

interface SavedHabUnitItemLevels {
  readonly status: 'saved'
}

interface StaleHabUnitItemLevels {
  readonly status: 'stale'
}

type SetHabUnitItemLevelsResult =
  | SavedHabUnitItemLevels
  | StaleHabUnitItemLevels

const setHabUnitItemLevels = async (
  itemId: string,
  levels: HouseholdItemLevels,
  client: SetHouseholdItemLevelsClient,
): Promise<SetHabUnitItemLevelsResult> => {
  const expectedCategory = getCategoryRpcArgs(levels.expectedCategory)
  const category = getCategoryRpcArgs(levels.category)
  const { error } = await client.rpc(DB_FUNCTION_SET_HOUSEHOLD_ITEM_LEVELS, {
    target_item_id: itemId,
    new_quantity: levels.quantity,
    new_minimum_quantity: levels.minimumQuantity,
    expected_quantity: levels.expectedQuantity,
    expected_category: expectedCategory.category,
    expected_custom_category_id: expectedCategory.customCategoryId,
    new_category: category.category,
    new_custom_category_id: category.customCategoryId,
  })

  if (error?.code === STALE_QUANTITY_ERROR_CODE) {
    return { status: 'stale' }
  }

  if (error) {
    throw new Error(`set_household_item_levels failed for item ${itemId}`, {
      cause: error,
    })
  }

  return { status: 'saved' }
}

export { setHabUnitItemLevels }
export type {
  HouseholdItemLevels,
  SetHabUnitItemLevelsResult,
  SetHouseholdItemLevelsClient,
}
