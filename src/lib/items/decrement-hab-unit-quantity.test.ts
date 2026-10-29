import { describe, expect, test } from 'vitest'

import { DB_FUNCTION_DECREMENT_HOUSEHOLD_QUANTITY } from '../db/entities'
import {
  decrementHabUnitQuantity,
  type DecrementHouseholdQuantityClient,
} from './decrement-hab-unit-quantity'

const BARCODE = '3017620422003'
const SCAN_SESSION_ID = '0b9c3f2e-5a1d-4c7e-8f46-2d1a9b7e3c50'
const CHANGE_ID = '7d4e1a90-3b2c-4f58-9a6d-8e0c5b1f2a37'

const createQuantityClientStub = (
  result: PromiseLike<{
    data: unknown
    error: { message: string } | null
  }>,
): DecrementHouseholdQuantityClient => ({
  rpc(functionName, args) {
    expect(functionName).toEqual(DB_FUNCTION_DECREMENT_HOUSEHOLD_QUANTITY)
    expect(args).toEqual({
      item_barcode: BARCODE,
      scan_session_id: SCAN_SESSION_ID,
    })
    return result
  },
})

describe('decrementHabUnitQuantity', () => {
  test('returns the change id and quantity from a successful rpc', async () => {
    const client = createQuantityClientStub(
      Promise.resolve({
        data: [{ change_id: CHANGE_ID, quantity: 1 }],
        error: null,
      }),
    )

    await expect(
      decrementHabUnitQuantity(BARCODE, SCAN_SESSION_ID, client),
    ).resolves.toEqual({ changeId: CHANGE_ID, quantity: 1 })
  })

  test('returns 0 when the rpc subtracts the last unit', async () => {
    const client = createQuantityClientStub(
      Promise.resolve({
        data: [{ change_id: CHANGE_ID, quantity: 0 }],
        error: null,
      }),
    )

    await expect(
      decrementHabUnitQuantity(BARCODE, SCAN_SESSION_ID, client),
    ).resolves.toEqual({ changeId: CHANGE_ID, quantity: 0 })
  })

  test('throws an error that names the barcode when the rpc returns an error', async () => {
    const rpcError = {
      message: 'decrement_household_quantity refuses a quantity below 0',
    }
    const client = createQuantityClientStub(
      Promise.resolve({ data: null, error: rpcError }),
    )

    await expect(
      decrementHabUnitQuantity(BARCODE, SCAN_SESSION_ID, client),
    ).rejects.toMatchObject({
      message: `decrement_household_quantity failed for barcode ${BARCODE}`,
      cause: rpcError,
    })
  })

  test.each([
    ['null', null],
    ['an empty array', []],
    ['a non-object row', ['row']],
    ['a row without a change id', [{ quantity: 1 }]],
    ['a row with a string quantity', [{ change_id: CHANGE_ID, quantity: '1' }]],
    ['a bare number', 0],
  ])(
    'throws an error that names the barcode when the rpc returns %s',
    async (_label, data) => {
      const client = createQuantityClientStub(
        Promise.resolve({ data, error: null }),
      )

      await expect(
        decrementHabUnitQuantity(BARCODE, SCAN_SESSION_ID, client),
      ).rejects.toThrow(
        `decrement_household_quantity failed for barcode ${BARCODE}`,
      )
    },
  )
})
