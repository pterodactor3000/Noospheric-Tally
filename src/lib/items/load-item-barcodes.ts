import { DB_TABLE_ITEM_BARCODES } from '../db/entities'
import { createClient } from '../supabase/server'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readItemBarcodes = (rows: unknown): string[] | null => {
  if (!Array.isArray(rows)) {
    return null
  }

  const barcodes: string[] = []

  for (const row of rows) {
    if (!isRecord(row) || typeof row.barcode !== 'string') {
      return null
    }

    barcodes.push(row.barcode)
  }

  return barcodes
}

const loadItemBarcodes = async (itemId: string): Promise<string[]> => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from(DB_TABLE_ITEM_BARCODES)
    .select('barcode')
    .eq('item_id', itemId)
    .order('created_at', { ascending: true })
    .order('barcode', { ascending: true })

  if (error) {
    throw new Error(`item_barcodes select failed for item ${itemId}`, {
      cause: error,
    })
  }

  const barcodes = readItemBarcodes(data)

  if (barcodes === null) {
    throw new Error(`item_barcodes select failed for item ${itemId}`)
  }

  return barcodes
}

export { loadItemBarcodes, readItemBarcodes }
