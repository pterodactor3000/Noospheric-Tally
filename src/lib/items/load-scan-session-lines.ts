import type { SupabaseClient } from '@supabase/supabase-js'

import { DB_TABLE_HOUSEHOLD_QUANTITY_CHANGES } from '../db/entities'

const SCAN_SESSION_LINE_COLUMNS =
  'id, barcode, quantity_delta, created_at, reversed_at, household_inventory(name)'

interface ScanSessionLine {
  readonly changeId: string
  readonly name: string
  readonly barcode: string
  readonly quantityDelta: 1 | -1
  readonly isReversed: boolean
  readonly createdAt: string
}

// The real client type. A hand-written structural subset of the query builder
// overflows the type checker when the Supabase client is assigned to it.
type ScanSessionLinesClient = Pick<SupabaseClient, 'from'>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readScanSessionLine = (row: unknown): ScanSessionLine | null => {
  if (!isRecord(row)) {
    return null
  }

  const {
    id,
    barcode,
    quantity_delta: quantityDelta,
    created_at: createdAt,
    reversed_at: reversedAt,
    household_inventory: inventory,
  } = row

  if (
    typeof id !== 'string' ||
    typeof barcode !== 'string' ||
    typeof createdAt !== 'string' ||
    (quantityDelta !== 1 && quantityDelta !== -1) ||
    (reversedAt !== null && typeof reversedAt !== 'string') ||
    !isRecord(inventory) ||
    typeof inventory.name !== 'string'
  ) {
    return null
  }

  return {
    changeId: id,
    name: inventory.name,
    barcode,
    quantityDelta,
    isReversed: reversedAt !== null,
    createdAt,
  }
}

const loadScanSessionLines = async (
  scanSessionId: string,
  client: ScanSessionLinesClient,
): Promise<ScanSessionLine[]> => {
  const { data, error } = await client
    .from(DB_TABLE_HOUSEHOLD_QUANTITY_CHANGES)
    .select(SCAN_SESSION_LINE_COLUMNS)
    .eq('scan_session_id', scanSessionId)
    .order('created_at', { ascending: false })

  const failureMessage = `select from household_quantity_changes failed for scan session ${scanSessionId}`
  if (error || !Array.isArray(data)) {
    throw new Error(failureMessage, error ? { cause: error } : undefined)
  }

  const lines: ScanSessionLine[] = []
  for (const row of data) {
    const line = readScanSessionLine(row)
    if (!line) {
      throw new Error(failureMessage)
    }
    lines.push(line)
  }

  return lines
}

export { loadScanSessionLines }
export type { ScanSessionLine, ScanSessionLinesClient }
