import { DB_FUNCTION_INCREMENT_HOUSEHOLD_QUANTITY } from '../db/entities'

interface IncrementHouseholdQuantityClient {
  rpc(
    functionName: typeof DB_FUNCTION_INCREMENT_HOUSEHOLD_QUANTITY,
    args: { item_barcode: string },
  ): PromiseLike<{
    data: number | null
    error: { message: string } | null
  }>
}

const incrementHabUnitQuantity = async (
  itemBarcode: string,
  client: IncrementHouseholdQuantityClient,
): Promise<number> => {
  const { data, error } = await client.rpc(
    DB_FUNCTION_INCREMENT_HOUSEHOLD_QUANTITY,
    { item_barcode: itemBarcode },
  )

  if (error || typeof data !== 'number') {
    throw new Error(
      `increment_household_quantity failed for barcode ${itemBarcode}`,
      error ? { cause: error } : undefined,
    )
  }

  return data
}

export { incrementHabUnitQuantity }
export type { IncrementHouseholdQuantityClient }
