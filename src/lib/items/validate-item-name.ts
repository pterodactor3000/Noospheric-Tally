interface ValidItemName {
  readonly status: 'valid'
  readonly name: string
}

interface InvalidItemName {
  readonly status: 'invalid'
  readonly message: string
}

type ItemNameValidationResult = ValidItemName | InvalidItemName

const VALIDATION_INVALID_LENGTH = 'Item does not match length restrictions'

const validateItemName = (name: string): ItemNameValidationResult => {
  const trimmed = name.trim()

  if (trimmed.length <= 0 || trimmed.length > 120) {
    return {
      status: 'invalid',
      message: VALIDATION_INVALID_LENGTH,
    }
  }

  return {
    status: 'valid',
    name: trimmed,
  }
}

export { validateItemName, type ItemNameValidationResult }
