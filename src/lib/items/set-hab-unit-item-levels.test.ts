import { describe, expect, test } from 'vitest'

import { DB_FUNCTION_SET_HOUSEHOLD_ITEM_LEVELS } from '../db/entities'
import {
  setHabUnitItemLevels,
  type SetHouseholdItemLevelsClient,
} from './set-hab-unit-item-levels'

const ITEM_ID = '7d4e1a90-3b2c-4f58-9a6d-8e0c5b1f2a37'
const LEVELS = { quantity: 4, minimumQuantity: 2 }

const createLevelsClientStub = (
  result: PromiseLike<{
    data: unknown
    error: { message: string } | null
  }>,
): SetHouseholdItemLevelsClient => ({
  rpc(functionName, args) {
    expect(functionName).toEqual(DB_FUNCTION_SET_HOUSEHOLD_ITEM_LEVELS)
    expect(args).toEqual({
      target_item_id: ITEM_ID,
      new_quantity: LEVELS.quantity,
      new_minimum_quantity: LEVELS.minimumQuantity,
    })
    return result
  },
})

describe('setHabUnitItemLevels', () => {
  test('resolves when the rpc stores both levels', async () => {
    const client = createLevelsClientStub(
      Promise.resolve({ data: null, error: null }),
    )

    await expect(setHabUnitItemLevels(ITEM_ID, LEVELS, client)).resolves.toEqual(
      undefined,
    )
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
