import { DB_FUNCTION_CREATE_ITEM_WITHOUT_BARCODE } from '../db/entities'

interface CreateItemWithoutBarcodeClient {
  rpc(
    functionName: typeof DB_FUNCTION_CREATE_ITEM_WITHOUT_BARCODE,
    args: { item_name: string },
  ): PromiseLike<{
    data: unknown
    error: { message: string } | null
  }>
}

const isNonEmptyItemId = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0

const createNewItemWithoutBarcode = async (
  itemName: string,
  client: CreateItemWithoutBarcodeClient,
): Promise<string> => {
  const { data, error } = await client.rpc(
    DB_FUNCTION_CREATE_ITEM_WITHOUT_BARCODE,
    { item_name: itemName },
  )

  if (error || !isNonEmptyItemId(data)) {
    throw new Error(
      `create_item_without_barcode failed for item name ${itemName}`,
      error ? { cause: error } : undefined,
    )
  }

  return data
}

export { createNewItemWithoutBarcode }
export type { CreateItemWithoutBarcodeClient }
