import { isItemCategory, type ItemCategory } from './item-category'
import { isScanSessionId } from './scan-session'

const CUSTOM_CATEGORY_KEY_PREFIX = 'custom-'

interface BuiltInCategoryRef {
  readonly kind: 'built-in'
  readonly category: ItemCategory
}

interface CustomCategoryRef {
  readonly kind: 'custom'
  readonly categoryId: string
}

type ItemCategoryRef = BuiltInCategoryRef | CustomCategoryRef

const getCategoryRefKey = (ref: ItemCategoryRef): string => {
  if (ref.kind === 'built-in') {
    return ref.category
  }

  return `${CUSTOM_CATEGORY_KEY_PREFIX}${ref.categoryId}`
}

const parseCategoryRefKey = (value: unknown): ItemCategoryRef | null => {
  if (isItemCategory(value)) {
    return { kind: 'built-in', category: value }
  }

  if (
    typeof value !== 'string' ||
    !value.startsWith(CUSTOM_CATEGORY_KEY_PREFIX)
  ) {
    return null
  }

  const categoryId = value.slice(CUSTOM_CATEGORY_KEY_PREFIX.length)
  if (!isScanSessionId(categoryId)) {
    return null
  }

  return { kind: 'custom', categoryId }
}

const getCategoryRpcArgs = (
  ref: ItemCategoryRef,
): { category: string | null; customCategoryId: string | null } => {
  if (ref.kind === 'built-in') {
    return { category: ref.category, customCategoryId: null }
  }

  return { category: null, customCategoryId: ref.categoryId }
}

export { getCategoryRefKey, getCategoryRpcArgs, parseCategoryRefKey }
export type { BuiltInCategoryRef, CustomCategoryRef, ItemCategoryRef }
