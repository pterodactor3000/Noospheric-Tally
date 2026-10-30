import { describe, expect, test } from 'vitest'

import { DB_FUNCTION_ADJUST_HOUSEHOLD_QUANTITY } from '../db/entities'
import {
  adjustHabUnitQuantity,
  type AdjustHouseholdQuantityClient,
} from './adjust-hab-unit-quantity'
import type { QuantityAdjustment } from './quantity-adjustment'

const ITEM_ID = '7d4e1a90-3b2c-4f58-9a6d-8e0c5b1f2a37'
const DELTA_QUANTITY: QuantityAdjustment = 1

const createAdjustClientStub = (
  result: PromiseLike<{
    data: unknown
    error: { message: string; code?: string } | null
  }>,
  deltaQuantity: QuantityAdjustment = DELTA_QUANTITY,
): AdjustHouseholdQuantityClient => ({
  rpc(functionName, args) {
    expect(functionName).toEqual(DB_FUNCTION_ADJUST_HOUSEHOLD_QUANTITY)
    expect(args).toEqual({
      target_item_id: ITEM_ID,
      delta_quantity: deltaQuantity,
    })
    return result
  },
})

describe('adjustHabUnitQuantity', () => {
  test('returns adjusted with the new quantity when the rpc returns an integer above 0', async () => {
    const client = createAdjustClientStub(
      Promise.resolve({ data: 4, error: null }),
    )

    await expect(
      adjustHabUnitQuantity(ITEM_ID, DELTA_QUANTITY, client),
    ).resolves.toEqual({ status: 'adjusted', quantity: 4 })
  })

  test('returns adjusted with quantity 0 when the rpc returns 0', async () => {
    const client = createAdjustClientStub(
      Promise.resolve({ data: 0, error: null }),
    )

    await expect(
      adjustHabUnitQuantity(ITEM_ID, DELTA_QUANTITY, client),
    ).resolves.toEqual({ status: 'adjusted', quantity: 0 })
  })

  test('returns below-zero when the rpc error code is 23514', async () => {
    const client = createAdjustClientStub(
      Promise.resolve({
        data: null,
        error: {
          message: 'adjust_household_quantity refuses a quantity below 0',
          code: '23514',
        },
      }),
    )

    await expect(
      adjustHabUnitQuantity(ITEM_ID, DELTA_QUANTITY, client),
    ).resolves.toEqual({ status: 'below-zero' })
  })

  test('throws an error that names the item id and keeps the rpc error as cause when the rpc returns another error', async () => {
    const rpcError = {
      message: 'adjust_household_quantity refuses an item this household does not stock',
      code: 'P0001',
    }
    const client = createAdjustClientStub(
      Promise.resolve({ data: null, error: rpcError }),
    )

    await expect(
      adjustHabUnitQuantity(ITEM_ID, DELTA_QUANTITY, client),
    ).rejects.toMatchObject({
      message: `adjust_household_quantity failed for item ${ITEM_ID}`,
      cause: rpcError,
    })
  })

  test.each([
    ['null', null],
    ['a string', '4'],
    ['a float', 1.5],
    ['an object', { quantity: 4 }],
  ])(
    'throws an error that names the item id when the rpc returns %s',
    async (_label, data) => {
      const client = createAdjustClientStub(
        Promise.resolve({ data, error: null }),
      )

      await expect(
        adjustHabUnitQuantity(ITEM_ID, DELTA_QUANTITY, client),
      ).rejects.toThrow(`adjust_household_quantity failed for item ${ITEM_ID}`)
    },
  )
})
