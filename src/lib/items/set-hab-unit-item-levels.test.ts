import { describe, expect, test } from 'vitest'

import { DB_FUNCTION_SET_HOUSEHOLD_ITEM_LEVELS } from '../db/entities'
import {
  setHabUnitItemLevels,
  type SetHouseholdItemLevelsClient,
} from './set-hab-unit-item-levels'

const ITEM_ID = '7d4e1a90-3b2c-4f58-9a6d-8e0c5b1f2a37'
const LEVELS = { quantity: 4, minimumQuantity: 2, expectedQuantity: 4 }

const createLevelsClientStub = (
  result: PromiseLike<{
    data: unknown
    error: { message: string; code?: string } | null
  }>,
): SetHouseholdItemLevelsClient => ({
  rpc(functionName, args) {
    expect(functionName).toEqual(DB_FUNCTION_SET_HOUSEHOLD_ITEM_LEVELS)
    expect(args).toEqual({
      target_item_id: ITEM_ID,
      new_quantity: LEVELS.quantity,
      new_minimum_quantity: LEVELS.minimumQuantity,
      expected_quantity: LEVELS.expectedQuantity,
    })
    return result
  },
})

describe('setHabUnitItemLevels', () => {
  test('returns saved when the rpc stores both levels', async () => {
    const client = createLevelsClientStub(
      Promise.resolve({ data: null, error: null }),
    )

    await expect(setHabUnitItemLevels(ITEM_ID, LEVELS, client)).resolves.toEqual({
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
