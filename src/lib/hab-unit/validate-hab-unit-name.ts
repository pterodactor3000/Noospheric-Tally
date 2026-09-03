interface ValidHabUnitName {
  readonly status: 'valid'
  readonly name: string
}

interface InvalidValidHabUnitName {
  readonly status: 'invalid'
  readonly message: string
}

type HabUnitNameValidationResult = ValidHabUnitName | InvalidValidHabUnitName

const VALIDATION_INVALID_LENGTH =
  'Hab-unit name does not match length requirements.'

const validateHabUnitName = (name: string): HabUnitNameValidationResult => {
  const trimmedName = name.trim()

  if (trimmedName.length <= 0 || trimmedName.length > 80) {
    return {
      status: 'invalid',
      message: VALIDATION_INVALID_LENGTH,
    }
  }

  return {
    status: 'valid',
    name: trimmedName,
  }
}

export { validateHabUnitName, type HabUnitNameValidationResult }
