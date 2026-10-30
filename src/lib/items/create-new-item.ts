import { DB_FUNCTION_CREATE_ITEM } from '../db/entities'
import { type ItemCategory } from './item-category'

interface CreateNewItemInput {
  readonly name: string
  readonly barcode: string
  readonly category: ItemCategory
}

interface CreateItemClient {
  rpc(
    functionName: typeof DB_FUNCTION_CREATE_ITEM,
    args: {
      item_name: string
      item_barcode: string
      item_category: string
    },
  ): PromiseLike<{
    data: unknown
    error: { message: string } | null
  }>
}

const isNonEmptyItemId = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0

const createNewItem = async (
  input: CreateNewItemInput,
  client: CreateItemClient,
): Promise<string> => {
  const { name, barcode, category } = input
  const { data, error } = await client.rpc(DB_FUNCTION_CREATE_ITEM, {
    item_name: name,
    item_barcode: barcode,
    item_category: category,
  })

  if (error || !isNonEmptyItemId(data)) {
    throw new Error(
      `create_item failed for barcode ${barcode}`,
      error ? { cause: error } : undefined,
    )
  }

  return data
}

export { createNewItem }
export type { CreateItemClient }
