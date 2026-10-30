import { DB_TABLE_ITEM_BARCODES } from '../db/entities'
import { createClient } from '../supabase/server'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const loadItemBarcode = async (itemId: string): Promise<string | null> => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from(DB_TABLE_ITEM_BARCODES)
    .select('barcode')
    .eq('item_id', itemId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(`item_barcodes select failed for item ${itemId}`, {
      cause: error,
    })
  }

  if (data === null) {
    return null
  }

  const row: unknown = data
  if (!isRecord(row) || typeof row.barcode !== 'string') {
    throw new Error(`item_barcodes select failed for item ${itemId}`)
  }

  return row.barcode
}

export { loadItemBarcode }
