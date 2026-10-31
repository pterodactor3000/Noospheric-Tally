import { describe, expect, test } from 'vitest'

import { DB_FUNCTION_CREATE_ITEMS_BULK } from '../db/entities'
import {
  createBulkItems,
  type CreateBulkItemsClient,
} from './create-bulk-items'
import { type BulkItemEntry } from './parse-bulk-items-file'

const ENTRIES: readonly BulkItemEntry[] = [
  { name: 'Nutella', barcode: '3017620422003' },
]

const UNCHANGED_ENTRIES: readonly BulkItemEntry[] = [
  { name: '  Nutella  ', barcode: ' 3017620422003 ' },
  { name: 'Milk', barcode: '4006381333931' },
]

const createBulkItemsClientStub = (
  entries: readonly BulkItemEntry[],
  result: PromiseLike<{
    data: unknown
    error: { message: string } | null
  }>,
): CreateBulkItemsClient => ({
  rpc(functionName, args) {
    expect(functionName).toEqual(DB_FUNCTION_CREATE_ITEMS_BULK)
    expect(args).toEqual({ items: entries })
    return result
  },
})

describe('createBulkItems', () => {
  test('returns the inserted count from a successful rpc', async () => {
    const client = createBulkItemsClientStub(
      ENTRIES,
      Promise.resolve({ data: ENTRIES.length, error: null }),
    )

    await expect(createBulkItems(ENTRIES, client)).resolves.toEqual(
      ENTRIES.length,
    )
  })

  test('passes the entries to the rpc unchanged', async () => {
    const client = createBulkItemsClientStub(
      UNCHANGED_ENTRIES,
      Promise.resolve({ data: UNCHANGED_ENTRIES.length, error: null }),
    )

    await expect(createBulkItems(UNCHANGED_ENTRIES, client)).resolves.toEqual(
      UNCHANGED_ENTRIES.length,
    )
  })

  test('rejects with the input count and the rpc error as cause when the rpc returns an error', async () => {
    const rpcError = { message: 'permission denied' }
    const client = createBulkItemsClientStub(
      ENTRIES,
      Promise.resolve({ data: null, error: rpcError }),
    )

    await expect(createBulkItems(ENTRIES, client)).rejects.toMatchObject({
      message: `create_items_bulk failed for ${ENTRIES.length} items`,
      cause: rpcError,
    })
  })

  test('rejects when the rpc returns no data', async () => {
    const client = createBulkItemsClientStub(
      ENTRIES,
      Promise.resolve({ data: null, error: null }),
    )

    await expect(createBulkItems(ENTRIES, client)).rejects.toThrow(
      `create_items_bulk failed for ${ENTRIES.length} items`,
    )
  })

  test('rejects when the rpc returns a count that differs from the input length', async () => {
    const client = createBulkItemsClientStub(
      ENTRIES,
      Promise.resolve({ data: ENTRIES.length + 1, error: null }),
    )

    await expect(createBulkItems(ENTRIES, client)).rejects.toThrow(
      `create_items_bulk failed for ${ENTRIES.length} items`,
    )
  })
})
