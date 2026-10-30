import type { SupabaseClient } from '@supabase/supabase-js'

import { DB_TABLE_HOUSEHOLD_QUANTITY_CHANGES } from '../db/entities'

const CONSUMPTION_RATE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

// The real client type. A hand-written structural subset of the query builder
// overflows the type checker when the Supabase client is assigned to it.
type ItemConsumptionCountClient = Pick<SupabaseClient, 'from'>

const loadItemConsumptionCount = async (
  itemId: string,
  now: Date,
  client: ItemConsumptionCountClient,
): Promise<number> => {
  if (Number.isNaN(now.getTime())) {
    throw new Error(
      `loadItemConsumptionCount rejected a time for item ${itemId}`,
    )
  }

  const windowStart = new Date(now.getTime() - CONSUMPTION_RATE_WINDOW_MS)
  const failureMessage = `select count from household_quantity_changes failed for item ${itemId}`

  const { count, error } = await client
    .from(DB_TABLE_HOUSEHOLD_QUANTITY_CHANGES)
    .select('id', { count: 'exact', head: true })
    .eq('item_id', itemId)
    .eq('quantity_delta', -1)
    .is('reversed_at', null)
    .gte('created_at', windowStart.toISOString())

  if (error || typeof count !== 'number') {
    throw new Error(failureMessage, error ? { cause: error } : undefined)
  }

  return count
}

export { CONSUMPTION_RATE_WINDOW_MS, loadItemConsumptionCount }
export type { ItemConsumptionCountClient }
