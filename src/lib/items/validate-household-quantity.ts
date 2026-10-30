const HOUSEHOLD_QUANTITY_MAX = 999999

const HOUSEHOLD_QUANTITY_PATTERN = /^\d{1,6}$/

interface ValidHouseholdQuantity {
  readonly status: 'valid'
  readonly quantity: number
}

interface InvalidHouseholdQuantity {
  readonly status: 'invalid'
  readonly message: string
}

type HouseholdQuantityValidationResult =
  | ValidHouseholdQuantity
  | InvalidHouseholdQuantity

const VALIDATION_INVALID_QUANTITY =
  'Count must be a whole number from 0 to 999999.'

const validateHouseholdQuantity = (
  rawValue: string,
): HouseholdQuantityValidationResult => {
  const trimmed = rawValue.trim()

  if (!HOUSEHOLD_QUANTITY_PATTERN.test(trimmed)) {
    return { status: 'invalid', message: VALIDATION_INVALID_QUANTITY }
  }

  const quantity = Number(trimmed)

  if (quantity > HOUSEHOLD_QUANTITY_MAX) {
    return { status: 'invalid', message: VALIDATION_INVALID_QUANTITY }
  }

  return { status: 'valid', quantity }
}

export {
  HOUSEHOLD_QUANTITY_MAX,
  validateHouseholdQuantity,
  type HouseholdQuantityValidationResult,
}
