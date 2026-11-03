import { describe, expect, test } from 'vitest'

import { DB_FUNCTION_SET_HOUSEHOLD_ITEM_LEVELS } from '../db/entities'
import { type ItemCategory } from './item-category'
import { type ItemCategoryRef } from './item-category-ref'
import {
  setHabUnitItemLevels,
  type HouseholdItemLevels,
  type SetHouseholdItemLevelsClient,
} from './set-hab-unit-item-levels'

const ITEM_ID = '7d4e1a90-3b2c-4f58-9a6d-8e0c5b1f2a37'
const CUSTOM_CATEGORY_ID = '0b9c3f2e-5a1d-4c7e-8f46-2d1a9b7e3c50'

const builtInCategory = (category: ItemCategory): ItemCategoryRef => ({
  kind: 'built-in',
  category,
})

const FOOD_CATEGORY = builtInCategory('food')

const LEVELS: HouseholdItemLevels = {
  quantity: 4,
  minimumQuantity: 2,
  expectedQuantity: 4,
  expectedCategory: FOOD_CATEGORY,
  category: FOOD_CATEGORY,
}

interface LevelsRpcArgs {
  readonly target_item_id: string
  readonly new_quantity: number
  readonly new_minimum_quantity: number
  readonly expected_quantity: number
  readonly expected_category: string | null
  readonly expected_custom_category_id: string | null
  readonly new_category: string | null
  readonly new_custom_category_id: string | null
}

const BUILT_IN_RPC_ARGS: LevelsRpcArgs = {
  target_item_id: ITEM_ID,
  new_quantity: LEVELS.quantity,
  new_minimum_quantity: LEVELS.minimumQuantity,
  expected_quantity: LEVELS.expectedQuantity,
  expected_category: 'food',
  expected_custom_category_id: null,
  new_category: 'food',
  new_custom_category_id: null,
}

const createLevelsClientStub = (
  result: PromiseLike<{
    data: unknown
    error: { message: string; code?: string } | null
  }>,
  args: LevelsRpcArgs = BUILT_IN_RPC_ARGS,
): SetHouseholdItemLevelsClient => ({
  rpc(functionName, receivedArgs) {
    expect(functionName).toEqual(DB_FUNCTION_SET_HOUSEHOLD_ITEM_LEVELS)
    expect(receivedArgs).toEqual(args)
    return result
  },
})

describe('setHabUnitItemLevels', () => {
  test('returns saved when the rpc stores a built-in category', async () => {
    const client = createLevelsClientStub(
      Promise.resolve({ data: null, error: null }),
    )

    await expect(setHabUnitItemLevels(ITEM_ID, LEVELS, client)).resolves.toEqual({
      status: 'saved',
    })
  })

  test('sends a built-in category and leaves the custom id empty', async () => {
    const category = builtInCategory('pet-food')
    const client = createLevelsClientStub(
      Promise.resolve({ data: null, error: null }),
      { ...BUILT_IN_RPC_ARGS, new_category: 'pet-food' },
    )

    await expect(
      setHabUnitItemLevels(ITEM_ID, { ...LEVELS, category }, client),
    ).resolves.toEqual({
      status: 'saved',
    })
  })

  test('sends a custom category id and leaves the built-in category empty', async () => {
    const category: ItemCategoryRef = {
      kind: 'custom',
      categoryId: CUSTOM_CATEGORY_ID,
    }
    const client = createLevelsClientStub(
      Promise.resolve({ data: null, error: null }),
      {
        ...BUILT_IN_RPC_ARGS,
        expected_category: null,
        expected_custom_category_id: CUSTOM_CATEGORY_ID,
        new_category: null,
        new_custom_category_id: CUSTOM_CATEGORY_ID,
      },
    )

    await expect(
      setHabUnitItemLevels(ITEM_ID, {
        ...LEVELS,
        expectedCategory: category,
        category,
      }, client),
    ).resolves.toEqual({
      status: 'saved',
    })
  })

  test('returns stale when the rpc error code is 40001', async () => {
    const client = createLevelsClientStub(
      Promise.resolve({
        data: null,
        error: {
          message: 'set_household_item_levels refuses a stale quantity',
          code: '40001',
        },
      }),
    )

    await expect(setHabUnitItemLevels(ITEM_ID, LEVELS, client)).resolves.toEqual({
      status: 'stale',
    })
  })

  test('throws an error that names the item id when the rpc returns an error', async () => {
    const rpcError = { message: 'permission denied' }
    const client = createLevelsClientStub(
      Promise.resolve({ data: null, error: rpcError }),
    )

    await expect(
      setHabUnitItemLevels(ITEM_ID, LEVELS, client),
    ).rejects.toMatchObject({
      message: `set_household_item_levels failed for item ${ITEM_ID}`,
      cause: rpcError,
    })
  })
})
