import { ITEM_CATEGORIES, type ItemCategory } from './item-category'

interface CategoryGroup<TLine> {
  readonly category: ItemCategory
  readonly lines: readonly TLine[]
}

const groupTallyLinesByCategory = <
  TLine extends { readonly category: ItemCategory },
>(
  lines: readonly TLine[],
): CategoryGroup<TLine>[] => {
  const linesByCategory = new Map<ItemCategory, TLine[]>(
    ITEM_CATEGORIES.map((category) => [category, []]),
  )

  for (const line of lines) {
    linesByCategory.get(line.category)?.push(line)
  }

  return ITEM_CATEGORIES.map((category) => ({
    category,
    lines: linesByCategory.get(category) ?? [],
  }))
}

export { groupTallyLinesByCategory }
export type { CategoryGroup }
