import { DB_FUNCTION_CREATE_ITEMS_BULK } from '../db/entities'
import { type BulkItemEntry } from './parse-bulk-items-file'

interface CreateBulkItemsClient {
  rpc(
    functionName: typeof DB_FUNCTION_CREATE_ITEMS_BULK,
    args: { items: readonly BulkItemEntry[] },
  ): PromiseLike<{
    data: unknown
    error: { message: string } | null
  }>
}

const isInsertedCount = (value: unknown, entryCount: number): value is number =>
  typeof value === 'number' && value === entryCount

const createBulkItems = async (
  entries: readonly BulkItemEntry[],
  client: CreateBulkItemsClient,
): Promise<number> => {
  const { data, error } = await client.rpc(DB_FUNCTION_CREATE_ITEMS_BULK, {
    items: entries,
  })

  if (error || !isInsertedCount(data, entries.length)) {
    throw new Error(
      `create_items_bulk failed for ${entries.length} items`,
      error ? { cause: error } : undefined,
    )
  }

  return data
}

export { createBulkItems }
export type { CreateBulkItemsClient }
