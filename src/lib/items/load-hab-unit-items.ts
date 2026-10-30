import { DB_TABLE_HOUSEHOLD_INVENTORY } from '../db/entities'
import { createClient } from '../supabase/server'
import { Item } from '../types'

interface HabUnitTallyLine {
  readonly itemId: string
  readonly name: string
  readonly quantity: number
  readonly minimumQuantity: number
}

const loadHabUnitItems = async ({
  limit,
}: {
  limit?: number
} = {}): Promise<Item[]> => {
  const supabase = await createClient()

  const query = supabase
    .from(DB_TABLE_HOUSEHOLD_INVENTORY)
    .select('item_id, name')
    .order('name', { ascending: true })

  const { data, error } = await (limit === undefined
    ? query
    : query.limit(limit))

  if (error || !data) {
    throw new Error('household_inventory select failed', {
      cause: error,
    })
  }

  return data.map((item) => ({
    itemId: item.item_id,
    name: item.name,
  }))
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readHabUnitTallyLine = (row: unknown): HabUnitTallyLine | null => {
  if (!isRecord(row)) {
    return null
  }

  const {
    item_id: itemId,
    name,
    quantity,
    minimum_quantity: minimumQuantity,
  } = row

  if (
    typeof itemId !== 'string' ||
    typeof name !== 'string' ||
    typeof quantity !== 'number' ||
    !Number.isInteger(quantity) ||
    typeof minimumQuantity !== 'number' ||
    !Number.isInteger(minimumQuantity)
  ) {
    return null
  }

  return { itemId, name, quantity, minimumQuantity }
}

const loadHabUnitTallyLines = async (): Promise<HabUnitTallyLine[]> => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from(DB_TABLE_HOUSEHOLD_INVENTORY)
    .select('item_id, name, quantity, minimum_quantity')
    .order('name', { ascending: true })

  const rows: unknown = data

  if (error || !Array.isArray(rows)) {
    throw new Error('household_inventory tally select failed', {
      cause: error,
    })
  }

  return rows.map((row: unknown) => {
    const line = readHabUnitTallyLine(row)

    if (!line) {
      throw new Error('household_inventory tally select failed')
    }

    return line
  })
}

export { loadHabUnitItems, loadHabUnitTallyLines, readHabUnitTallyLine }
export type { HabUnitTallyLine }
