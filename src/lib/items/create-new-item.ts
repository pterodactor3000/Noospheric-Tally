import { DB_FUNCTION_CREATE_ITEM } from '../db/entities'
import { createClient } from '../supabase/server'

const createNewItem = async (
  itemName: string,
  itemBarcode: string,
): Promise<string> => {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc(DB_FUNCTION_CREATE_ITEM, {
    item_name: itemName,
    item_barcode: itemBarcode,
  })

  if (error || !data) {
    throw new Error(`create_item failed for barcode ${itemBarcode}`, {
      cause: error,
    })
  }

  return data
}

export { createNewItem }
