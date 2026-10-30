import {
  DB_FUNCTION_FIND_ITEM_BY_BARCODE,
  DB_TABLE_HOUSEHOLD_INVENTORY,
} from '../db/entities'
import { dbFindItemByBarcode } from '../db/types'
import { createClient } from '../supabase/server'
import { Item } from '../types'
import { readHabUnitTallyLine } from './load-hab-unit-items'

interface HabUnitStockedItem extends Item {
  readonly quantity: number
  readonly minimumQuantity: number
}

// Local row type: the shared dbHabUnitInventory type stays quantity-free
// so loadHabUnitItems remains name-only.
interface HabUnitItemRow {
  readonly item_id: string
  readonly name: string
  readonly quantity: number
  readonly minimum_quantity: number
}

const loadHabUnitItemByBarcode = async (
  barcode: string,
): Promise<HabUnitStockedItem | null> => {
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
    .select('item_id, name, quantity, minimum_quantity')
    .eq('item_id', findItem.item_id)
    .maybeSingle<HabUnitItemRow>()

  if (itemError) {
    throw new Error(
      `select from household_inventory returned error: ${itemError.message}`,
    )
  }

  if (!habUnitItem) {
    return null
  }

  const line = readHabUnitTallyLine(habUnitItem)

  if (!line) {
    throw new Error(
      `select from household_inventory returned an invalid row for item ${findItem.item_id}`,
    )
  }

  return line
}

export { loadHabUnitItemByBarcode }
export type { HabUnitStockedItem }
