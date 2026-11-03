import { ITEM_CATEGORY_LABELS } from './item-category'

interface ValidCategoryName {
  readonly status: 'valid'
  readonly name: string
}

interface InvalidCategoryName {
  readonly status: 'invalid'
  readonly message: string
}

type CategoryNameValidationResult = ValidCategoryName | InvalidCategoryName

const CATEGORY_NAME_MAX_LENGTH = 40

const CATEGORY_NAME_LENGTH_MESSAGE =
  'Category name does not match length restrictions'

const CATEGORY_NAME_BUILT_IN_MESSAGE =
  'Category name matches a built-in category'

const BUILT_IN_CATEGORY_LABELS = new Set(
  Object.values(ITEM_CATEGORY_LABELS).map((label) => label.toLowerCase()),
)

const validateCategoryName = (name: string): CategoryNameValidationResult => {
  const trimmed = name.trim()

  if (trimmed.length <= 0 || trimmed.length > CATEGORY_NAME_MAX_LENGTH) {
    return {
      status: 'invalid',
      message: CATEGORY_NAME_LENGTH_MESSAGE,
    }
  }

  if (BUILT_IN_CATEGORY_LABELS.has(trimmed.toLowerCase())) {
    return {
      status: 'invalid',
      message: CATEGORY_NAME_BUILT_IN_MESSAGE,
    }
  }

  return {
    status: 'valid',
    name: trimmed,
  }
}

export { validateCategoryName, type CategoryNameValidationResult }
