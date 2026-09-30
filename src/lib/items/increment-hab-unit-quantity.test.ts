import { describe, expect, test } from 'vitest'

import { DB_FUNCTION_INCREMENT_HOUSEHOLD_QUANTITY } from '../db/entities'
import {
  incrementHabUnitQuantity,
  type IncrementHouseholdQuantityClient,
} from './increment-hab-unit-quantity'

const BARCODE = '3017620422003'

const createQuantityClientStub = (
  result: PromiseLike<{
    data: number | null
    error: { message: string } | null
  }>,
): IncrementHouseholdQuantityClient => ({
  rpc(functionName, args) {
    expect(functionName).toEqual(DB_FUNCTION_INCREMENT_HOUSEHOLD_QUANTITY)
    expect(args).toEqual({ item_barcode: BARCODE })
    return result
  },
})

describe('incrementHabUnitQuantity', () => {
  test('returns the quantity from a successful rpc', async () => {
    const client = createQuantityClientStub(
      Promise.resolve({ data: 2, error: null }),
    )

    await expect(incrementHabUnitQuantity(BARCODE, client)).resolves.toEqual(2)
  })

  test('returns 0 when the rpc quantity is 0', async () => {
    const client = createQuantityClientStub(
      Promise.resolve({ data: 0, error: null }),
    )

    await expect(incrementHabUnitQuantity(BARCODE, client)).resolves.toEqual(0)
  })

  test('throws an error that names the barcode when the rpc returns an error', async () => {
    const rpcError = { message: 'permission denied' }
    const client = createQuantityClientStub(
      Promise.resolve({ data: null, error: rpcError }),
    )

    await expect(incrementHabUnitQuantity(BARCODE, client)).rejects.toMatchObject(
      {
        message: `increment_household_quantity failed for barcode ${BARCODE}`,
        cause: rpcError,
      },
    )
  })

  test('throws an error that names the barcode when the rpc returns null', async () => {
    const client = createQuantityClientStub(
      Promise.resolve({ data: null, error: null }),
    )

    await expect(incrementHabUnitQuantity(BARCODE, client)).rejects.toThrow(
      `increment_household_quantity failed for barcode ${BARCODE}`,
    )
  })
})
