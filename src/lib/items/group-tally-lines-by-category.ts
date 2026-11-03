import { ITEM_CATEGORIES, ITEM_CATEGORY_LABELS } from './item-category'
import { getCategoryRefKey, type ItemCategoryRef } from './item-category-ref'
import type { HabUnitCategory } from './load-hab-unit-categories'

interface CategoryGroup<TLine> {
  readonly key: string
  readonly ref: ItemCategoryRef
  readonly label: string
  readonly lines: readonly TLine[]
}

const compareHabUnitCategories = (
  left: HabUnitCategory,
  right: HabUnitCategory,
): number => {
  const createdAtComparison = left.createdAt.localeCompare(right.createdAt)
  if (createdAtComparison !== 0) {
    return createdAtComparison
  }

  return left.id.localeCompare(right.id)
}

const groupTallyLinesByCategory = <
  TLine extends { readonly category: ItemCategoryRef },
>(
  lines: readonly TLine[],
  customCategories: readonly HabUnitCategory[],
): CategoryGroup<TLine>[] => {
  const orderedCustomCategories = [...customCategories].sort(
    compareHabUnitCategories,
  )
  const customCategoryIds = new Set(
    orderedCustomCategories.map((category) => category.id),
  )
  const linesByKey = new Map<string, TLine[]>()

  for (const category of orderedCustomCategories) {
    linesByKey.set(
      getCategoryRefKey({ kind: 'custom', categoryId: category.id }),
      [],
    )
  }

  for (const category of ITEM_CATEGORIES) {
    linesByKey.set(getCategoryRefKey({ kind: 'built-in', category }), [])
  }

  const uncategorizedKey = getCategoryRefKey({
    kind: 'built-in',
    category: 'uncategorized',
  })

  for (const line of lines) {
    if (
      line.category.kind === 'custom' &&
      !customCategoryIds.has(line.category.categoryId)
    ) {
      linesByKey.get(uncategorizedKey)?.push(line)
      continue
    }

    linesByKey.get(getCategoryRefKey(line.category))?.push(line)
  }

  const customGroups = orderedCustomCategories.map((category) => {
    const ref: ItemCategoryRef = { kind: 'custom', categoryId: category.id }
    const key = getCategoryRefKey(ref)
    return {
      key,
      ref,
      label: category.name,
      lines: linesByKey.get(key) ?? [],
    }
  })

  const builtInGroups = ITEM_CATEGORIES.map((category) => {
    const ref: ItemCategoryRef = { kind: 'built-in', category }
    const key = getCategoryRefKey(ref)
    return {
      key,
      ref,
      label: ITEM_CATEGORY_LABELS[category],
      lines: linesByKey.get(key) ?? [],
    }
  })

  return [...customGroups, ...builtInGroups]
}

export { groupTallyLinesByCategory }
export type { CategoryGroup }
