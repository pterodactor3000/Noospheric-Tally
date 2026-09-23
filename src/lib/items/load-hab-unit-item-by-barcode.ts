import {
  DB_FUNCTION_FIND_ITEM_BY_BARCODE,
  DB_TABLE_HOUSEHOLD_INVENTORY,
} from '../db/entities'
import { dbFindItemByBarcode, dbHabUnitInventory } from '../db/types'
import { createClient } from '../supabase/server'
import { Item } from '../types'

const loadHabUnitItemByBarcode = async (
  barcode: string,
): Promise<Item | null> => {
  const supabase = await createClient()
  const { data: findItem, error } = await supabase
    .rpc(DB_FUNCTION_FIND_ITEM_BY_BARCODE, { item_barcode: barcode })
    .maybeSingle<dbFindItemByBarcode>()

  if (error) {
    throw new Error(
      `find_item_by_barcode function returned error: ${error.message}`,
    )
  }

  if (!findItem) {
    return null
  }

  const { data: habUnitItem, error: itemError } = await supabase
    .from(DB_TABLE_HOUSEHOLD_INVENTORY)
    .select('item_id, name')
    .eq('item_id', findItem.item_id)
    .maybeSingle<dbHabUnitInventory>()

  if (itemError) {
    throw new Error(
      `select from household_inventory returned error: ${itemError.message}`,
    )
  }

  if (!habUnitItem) {
    return null
  }

  return {
    itemId: habUnitItem.item_id,
    name: habUnitItem.name,
  }
}

export { loadHabUnitItemByBarcode }
