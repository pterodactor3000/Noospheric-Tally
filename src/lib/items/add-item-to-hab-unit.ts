import { DB_FUNCTION_ADD_ITEM_TO_HOUSEHOLD } from '../db/entities'
import { createClient } from '../supabase/server'

const addItemToHabUnit = async (
  itemId: string,
  itemName: string,
): Promise<void> => {
  const supabase = await createClient()
  const { error } = await supabase.rpc(DB_FUNCTION_ADD_ITEM_TO_HOUSEHOLD, {
    target_item_id: itemId,
    item_name: itemName,
  })

  if (error) {
    throw new Error(`add_item_to_household failed for item ${itemId}`, {
      cause: error,
    })
  }
}

export { addItemToHabUnit }
