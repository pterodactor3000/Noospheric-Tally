import { DB_TABLE_HOUSEHOLD_INVENTORY } from '../db/entities'
import { createClient } from '../supabase/server'
import { Item } from '../types'

const loadHabUnitItems = async ({
  limit,
}: {
  limit?: number
} = {}): Promise<Item[] | null> => {
  const supabase = await createClient()

  const query = supabase
    .from(DB_TABLE_HOUSEHOLD_INVENTORY)
    .select('item_id, name')
    .order('name', { ascending: true })

  const { data, error } = await (limit === undefined
    ? query
    : query.limit(limit))

  if (error) {
    return null
  }

  if (!error && !data) {
    return []
  }

  return data.map((item) => ({
    itemId: item.item_id,
    name: item.name,
  }))
}

export { loadHabUnitItems }
