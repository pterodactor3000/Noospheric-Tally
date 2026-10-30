import { describe, expect, test } from 'vitest'

import { DB_FUNCTION_SET_HOUSEHOLD_MINIMUM_QUANTITY } from '../db/entities'
import {
  setHabUnitMinimumQuantity,
  type SetHouseholdMinimumQuantityClient,
} from './set-hab-unit-minimum-quantity'

const ITEM_ID = '7d4e1a90-3b2c-4f58-9a6d-8e0c5b1f2a37'
const MINIMUM_QUANTITY = 5

const createMinimumClientStub = (
  result: PromiseLike<{
    data: unknown
    error: { message: string } | null
  }>,
): SetHouseholdMinimumQuantityClient => ({
  rpc(functionName, args) {
    expect(functionName).toEqual(DB_FUNCTION_SET_HOUSEHOLD_MINIMUM_QUANTITY)
    expect(args).toEqual({
      target_item_id: ITEM_ID,
      new_minimum_quantity: MINIMUM_QUANTITY,
    })
    return result
  },
})

describe('setHabUnitMinimumQuantity', () => {
  test('returns the stored minimum from a successful rpc', async () => {
    const client = createMinimumClientStub(
      Promise.resolve({ data: 5, error: null }),
    )

    await expect(
      setHabUnitMinimumQuantity(ITEM_ID, MINIMUM_QUANTITY, client),
    ).resolves.toEqual(5)
  })

  test('returns 0 when the rpc stored a minimum of 0', async () => {
    const client = createMinimumClientStub(
      Promise.resolve({ data: 0, error: null }),
    )

    await expect(
      setHabUnitMinimumQuantity(ITEM_ID, MINIMUM_QUANTITY, client),
    ).resolves.toEqual(0)
  })

  test('throws an error that names the item id when the rpc returns an error', async () => {
    const rpcError = { message: 'permission denied' }
    const client = createMinimumClientStub(
      Promise.resolve({ data: null, error: rpcError }),
    )

    await expect(
      setHabUnitMinimumQuantity(ITEM_ID, MINIMUM_QUANTITY, client),
    ).rejects.toMatchObject({
      message: `set_household_minimum_quantity failed for item ${ITEM_ID}`,
      cause: rpcError,
    })
  })

  test.each([
    ['null', null],
    ['a string', '5'],
    ['a float', 2.5],
    ['an array', [5]],
    ['an object', { minimum_quantity: 5 }],
  ])(
    'throws an error that names the item id when the rpc returns %s',
    async (_label, data) => {
      const client = createMinimumClientStub(
        Promise.resolve({ data, error: null }),
      )

      await expect(
        setHabUnitMinimumQuantity(ITEM_ID, MINIMUM_QUANTITY, client),
      ).rejects.toThrow(
        `set_household_minimum_quantity failed for item ${ITEM_ID}`,
      )
    },
  )
})
