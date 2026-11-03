import { DB_TABLE_HOUSEHOLD_INVENTORY } from '../db/entities'
import { createClient } from '../supabase/server'
import { Item } from '../types'
import { isItemCategory } from './item-category'
import type { ItemCategoryRef } from './item-category-ref'
import { isScanSessionId } from './scan-session'

interface HabUnitTallyLine {
  readonly itemId: string
  readonly name: string
  readonly quantity: number
  readonly minimumQuantity: number
  readonly category: ItemCategoryRef
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

const readCategoryRef = (
  category: unknown,
  customCategoryId: unknown,
): ItemCategoryRef | null => {
  if (
    (category !== null &&
      category !== undefined &&
      typeof category !== 'string') ||
    (customCategoryId !== null &&
      customCategoryId !== undefined &&
      typeof customCategoryId !== 'string')
  ) {
    return null
  }

  const categoryText = typeof category === 'string' ? category : null
  const customCategoryText =
    typeof customCategoryId === 'string' ? customCategoryId : null
  const hasCategory = categoryText !== null
  const hasCustomCategory = customCategoryText !== null

  if (hasCategory === hasCustomCategory) {
    return null
  }

  if (categoryText !== null) {
    if (!isItemCategory(categoryText)) {
      return null
    }

    return { kind: 'built-in', category: categoryText }
  }

  if (!isScanSessionId(customCategoryText)) {
    return null
  }

  return { kind: 'custom', categoryId: customCategoryText }
}

const readHabUnitTallyLine = (row: unknown): HabUnitTallyLine | null => {
  if (!isRecord(row)) {
    return null
  }

  const {
    item_id: itemId,
    name,
    quantity,
    minimum_quantity: minimumQuantity,
    category,
    custom_category_id: customCategoryId,
  } = row
  const categoryRef = readCategoryRef(category, customCategoryId)

  if (
    typeof itemId !== 'string' ||
    typeof name !== 'string' ||
    typeof quantity !== 'number' ||
    !Number.isInteger(quantity) ||
    typeof minimumQuantity !== 'number' ||
    !Number.isInteger(minimumQuantity) ||
    categoryRef === null
  ) {
    return null
  }

  return {
    itemId,
    name,
    quantity,
    minimumQuantity,
    category: categoryRef,
  }
}

const loadHabUnitTallyLines = async (): Promise<HabUnitTallyLine[]> => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from(DB_TABLE_HOUSEHOLD_INVENTORY)
    .select(
      'item_id, name, quantity, minimum_quantity, category, custom_category_id',
    )
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
