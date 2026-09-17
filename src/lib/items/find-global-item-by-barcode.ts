import { DB_FUNCTION_FIND_ITEM_BY_BARCODE } from '../db/entities'
import { dbFindItemByBarcode } from '../db/types'
import { createClient } from '../supabase/server'
import { Item } from '../types'

const findGlobalItemByBarcode = async (
  barcode: string,
): Promise<Item | null> => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc(DB_FUNCTION_FIND_ITEM_BY_BARCODE, { item_barcode: barcode })
    .maybeSingle<dbFindItemByBarcode>()

  if (!data || error) {
    return null
  }

  return {
    itemId: data.item_id,
    name: data.canonical_name,
  }
}

export { findGlobalItemByBarcode }
