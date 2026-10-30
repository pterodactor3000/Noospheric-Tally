import { describe, expect, test } from 'vitest'

import { DB_FUNCTION_CREATE_ITEM } from '../db/entities'
import { createNewItem, type CreateItemClient } from './create-new-item'
import { type ItemCategory } from './item-category'

const ITEM_NAME = 'Nutella'
const BARCODE = '3017620422003'
const ITEM_ID = '7d4e1a90-3b2c-4f58-9a6d-8e0c5b1f2a37'
const CATEGORY: ItemCategory = 'food'

const createItemClientStub = (
  result: PromiseLike<{
    data: unknown
    error: { message: string } | null
  }>,
  category: ItemCategory = CATEGORY,
): CreateItemClient => ({
  rpc(functionName, args) {
    expect(functionName).toEqual(DB_FUNCTION_CREATE_ITEM)
    expect(args).toEqual({
      item_name: ITEM_NAME,
      item_barcode: BARCODE,
      item_category: category,
    })
    return result
  },
})

describe('createNewItem', () => {
  test('returns the item id from a successful rpc', async () => {
    const client = createItemClientStub(
      Promise.resolve({ data: ITEM_ID, error: null }),
    )

    await expect(
      createNewItem(
        { name: ITEM_NAME, barcode: BARCODE, category: CATEGORY },
        client,
      ),
    ).resolves.toEqual(ITEM_ID)
  })

  test('sends the category to the rpc', async () => {
    const category: ItemCategory = 'pet-food'
    const client = createItemClientStub(
      Promise.resolve({ data: ITEM_ID, error: null }),
      category,
    )

    await expect(
      createNewItem({ name: ITEM_NAME, barcode: BARCODE, category }, client),
    ).resolves.toEqual(ITEM_ID)
  })

  test('rejects with the barcode and the rpc error as cause', async () => {
    const rpcError = { message: 'permission denied' }
    const client = createItemClientStub(
      Promise.resolve({ data: null, error: rpcError }),
    )

    await expect(
      createNewItem(
        { name: ITEM_NAME, barcode: BARCODE, category: CATEGORY },
        client,
      ),
    ).rejects.toMatchObject({
      message: `create_item failed for barcode ${BARCODE}`,
      cause: rpcError,
    })
  })

  test('rejects when the rpc returns no id', async () => {
    const client = createItemClientStub(
      Promise.resolve({ data: null, error: null }),
    )

    await expect(
      createNewItem(
        { name: ITEM_NAME, barcode: BARCODE, category: CATEGORY },
        client,
      ),
    ).rejects.toThrow(`create_item failed for barcode ${BARCODE}`)
  })
})
