import { DB_TABLE_HOUSEHOLD_CATEGORIES } from '../db/entities'
import { createClient } from '../supabase/server'
import { isScanSessionId } from './scan-session'

interface HabUnitCategory {
  readonly id: string
  readonly name: string
  readonly createdAt: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readHabUnitCategory = (row: unknown): HabUnitCategory | null => {
  if (!isRecord(row)) {
    return null
  }

  const { id, name, created_at: createdAt } = row

  if (
    !isScanSessionId(id) ||
    typeof name !== 'string' ||
    typeof createdAt !== 'string'
  ) {
    return null
  }

  return { id, name, createdAt }
}

const loadHabUnitCategories = async (): Promise<HabUnitCategory[]> => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from(DB_TABLE_HOUSEHOLD_CATEGORIES)
    .select('id, name, created_at')

  const rows: unknown = data

  if (error || !Array.isArray(rows)) {
    throw new Error('household_categories select failed', {
      cause: error,
    })
  }

  return rows.map((row: unknown) => {
    const category = readHabUnitCategory(row)

    if (!category) {
      throw new Error('household_categories select failed')
    }

    return category
  })
}

export { loadHabUnitCategories }
export type { HabUnitCategory }
