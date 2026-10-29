import { describe, expect, test } from 'vitest'

import { DB_FUNCTION_REVERSE_QUANTITY_CHANGE } from '../db/entities'
import {
  reverseQuantityChange,
  type ReverseQuantityChangeClient,
} from './reverse-quantity-change'

const CHANGE_ID = '7d4e1a90-3b2c-4f58-9a6d-8e0c5b1f2a37'

const createReverseClientStub = (
  result: PromiseLike<{
    data: unknown
    error: { message: string; code?: string } | null
  }>,
): ReverseQuantityChangeClient => ({
  rpc(functionName, args) {
    expect(functionName).toEqual(DB_FUNCTION_REVERSE_QUANTITY_CHANGE)
    expect(args).toEqual({ change_id: CHANGE_ID })
    return result
  },
})

describe('reverseQuantityChange', () => {
  test('returns reversed with the new quantity when the rpc returns a number', async () => {
    const client = createReverseClientStub(
      Promise.resolve({ data: 3, error: null }),
    )

    await expect(reverseQuantityChange(CHANGE_ID, client)).resolves.toEqual({
      status: 'reversed',
      quantity: 3,
    })
  })

  test('returns reversed with quantity 0 when the rpc returns 0', async () => {
    const client = createReverseClientStub(
      Promise.resolve({ data: 0, error: null }),
    )

    await expect(reverseQuantityChange(CHANGE_ID, client)).resolves.toEqual({
      status: 'reversed',
      quantity: 0,
    })
  })

  test('returns below-zero when the rpc error code is 23514', async () => {
    const client = createReverseClientStub(
      Promise.resolve({
        data: null,
        error: {
          message: 'reverse_quantity_change refuses a quantity below 0',
          code: '23514',
        },
      }),
    )

    await expect(reverseQuantityChange(CHANGE_ID, client)).resolves.toEqual({
      status: 'below-zero',
    })
  })

  test('throws with the change id and cause when the rpc error code is not 23514', async () => {
    const rpcError = {
      message: 'reverse_quantity_change refuses a change that is already reversed',
      code: 'P0001',
    }
    const client = createReverseClientStub(
      Promise.resolve({ data: null, error: rpcError }),
    )

    await expect(
      reverseQuantityChange(CHANGE_ID, client),
    ).rejects.toMatchObject({
      message: `reverse_quantity_change failed for change ${CHANGE_ID}`,
      cause: rpcError,
    })
  })

  test('throws with the change id when the rpc error has no code', async () => {
    const rpcError = { message: 'network down' }
    const client = createReverseClientStub(
      Promise.resolve({ data: null, error: rpcError }),
    )

    await expect(
      reverseQuantityChange(CHANGE_ID, client),
    ).rejects.toMatchObject({
      message: `reverse_quantity_change failed for change ${CHANGE_ID}`,
      cause: rpcError,
    })
  })

  test.each([
    ['null', null],
    ['a string', '3'],
    ['an array', [3]],
  ])(
    'throws with the change id when the rpc returns %s and no error',
    async (_label, data) => {
      const client = createReverseClientStub(
        Promise.resolve({ data, error: null }),
      )

      await expect(reverseQuantityChange(CHANGE_ID, client)).rejects.toThrow(
        `reverse_quantity_change failed for change ${CHANGE_ID}`,
      )
    },
  )
})
