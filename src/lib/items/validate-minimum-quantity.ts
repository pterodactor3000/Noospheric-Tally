import {
  DEFAULT_MINIMUM_QUANTITY,
  MINIMUM_QUANTITY_MAX,
  MINIMUM_QUANTITY_MIN,
} from './stock-state'

interface ValidMinimumQuantity {
  readonly status: 'valid'
  readonly minimumQuantity: number
}

interface InvalidMinimumQuantity {
  readonly status: 'invalid'
  readonly message: string
}

type MinimumQuantityValidationResult =
  | ValidMinimumQuantity
  | InvalidMinimumQuantity

const MINIMUM_QUANTITY_PATTERN = /^[0-9]{1,3}$/

const VALIDATION_INVALID_MINIMUM =
  'Minimum must be a whole number from 0 to 999.'

const validateMinimumQuantity = (
  rawValue: string,
): MinimumQuantityValidationResult => {
  const trimmed = rawValue.trim()

  if (trimmed.length === 0) {
    return { status: 'valid', minimumQuantity: DEFAULT_MINIMUM_QUANTITY }
  }

  if (!MINIMUM_QUANTITY_PATTERN.test(trimmed)) {
    return { status: 'invalid', message: VALIDATION_INVALID_MINIMUM }
  }

  const minimumQuantity = Number(trimmed)

  if (
    minimumQuantity < MINIMUM_QUANTITY_MIN ||
    minimumQuantity > MINIMUM_QUANTITY_MAX
  ) {
    return { status: 'invalid', message: VALIDATION_INVALID_MINIMUM }
  }

  return { status: 'valid', minimumQuantity }
}

export { validateMinimumQuantity, type MinimumQuantityValidationResult }
