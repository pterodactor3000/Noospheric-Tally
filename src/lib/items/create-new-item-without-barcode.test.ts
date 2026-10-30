import { describe, expect, test } from 'vitest'

import { DB_FUNCTION_CREATE_ITEM_WITHOUT_BARCODE } from '../db/entities'
import {
  createNewItemWithoutBarcode,
  type CreateItemWithoutBarcodeClient,
} from './create-new-item-without-barcode'

const ITEM_NAME = 'Cinnamon'
const ITEM_ID = '7d4e1a90-3b2c-4f58-9a6d-8e0c5b1f2a37'

const createItemClientStub = (
  result: PromiseLike<{
    data: unknown
    error: { message: string } | null
  }>,
): CreateItemWithoutBarcodeClient => ({
  rpc(functionName, args) {
    expect(functionName).toEqual(DB_FUNCTION_CREATE_ITEM_WITHOUT_BARCODE)
    expect(args).toEqual({ item_name: ITEM_NAME })
    return result
  },
})

describe('createNewItemWithoutBarcode', () => {
  test('returns the item id from a successful rpc', async () => {
    const client = createItemClientStub(
      Promise.resolve({ data: ITEM_ID, error: null }),
    )

    await expect(
      createNewItemWithoutBarcode(ITEM_NAME, client),
    ).resolves.toEqual(ITEM_ID)
  })

  test('rejects with the item name and the rpc error as cause', async () => {
    const rpcError = { message: 'permission denied' }
    const client = createItemClientStub(
      Promise.resolve({ data: null, error: rpcError }),
    )

    await expect(createNewItemWithoutBarcode(ITEM_NAME, client)).rejects.toMatchObject(
      {
        message: `create_item_without_barcode failed for item name ${ITEM_NAME}`,
        cause: rpcError,
      },
    )
  })

  test.each([
    ['null', null],
    ['an empty string', ''],
    ['a number', 1],
    ['an object', { id: ITEM_ID }],
  ])(
    'rejects with the item name when the rpc returns %s',
    async (_label, data) => {
      const client = createItemClientStub(Promise.resolve({ data, error: null }))

      await expect(createNewItemWithoutBarcode(ITEM_NAME, client)).rejects.toThrow(
        `create_item_without_barcode failed for item name ${ITEM_NAME}`,
      )
    },
  )
})
