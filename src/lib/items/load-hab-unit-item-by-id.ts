import { DB_TABLE_HOUSEHOLD_INVENTORY } from '../db/entities'
import { createClient } from '../supabase/server'
import { readHabUnitTallyLine, type HabUnitTallyLine } from './load-hab-unit-items'

const loadHabUnitItemById = async (
  itemId: string,
): Promise<HabUnitTallyLine | null> => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from(DB_TABLE_HOUSEHOLD_INVENTORY)
    .select('item_id, name, quantity, minimum_quantity, category')
    .eq('item_id', itemId)
    .maybeSingle()

  if (error) {
    throw new Error(
      `household_inventory item select failed for item ${itemId}`,
      { cause: error },
    )
  }

  if (data === null) {
    return null
  }

  const row: unknown = data
  const line = readHabUnitTallyLine(row)

  if (!line) {
    throw new Error(
      `household_inventory item select failed for item ${itemId}`,
    )
  }

  return line
}

export { loadHabUnitItemById }
