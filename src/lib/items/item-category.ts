const ITEM_CATEGORIES = [
  'pet-food',
  'food',
  'beauty',
  'other',
  'uncategorized',
] as const

type ItemCategory = (typeof ITEM_CATEGORIES)[number]

const DEFAULT_ITEM_CATEGORY: ItemCategory = 'uncategorized'

const ITEM_CATEGORY_LABELS: Readonly<Record<ItemCategory, string>> = {
  'pet-food': 'Pet food',
  food: 'Food',
  beauty: 'Beauty',
  other: 'Other',
  uncategorized: 'Uncategorized',
}

const isItemCategory = (value: unknown): value is ItemCategory =>
  typeof value === 'string' &&
  ITEM_CATEGORIES.some((category) => category === value)

export {
  DEFAULT_ITEM_CATEGORY,
  ITEM_CATEGORIES,
  ITEM_CATEGORY_LABELS,
  isItemCategory,
}
export type { ItemCategory }
