interface ValidBarcode {
  readonly status: 'valid'
  readonly barcode: string
}

interface InvalidBarcode {
  readonly status: 'invalid'
  readonly message: string
}

type BarcodeValidationResult = ValidBarcode | InvalidBarcode

interface ValidateBarcodeOptions {
  readonly isUpcE?: boolean
}

const VALIDATION_INVALID_BARCODE = 'Barcode does not match restrictions'

/**
 * Calculates the GS1 check digit for GTIN data digits.
 * @param dataDigits - The digits of the barcode without the check digit.
 * @returns The check digit.
 */
const getGtinCheckDigit = (dataDigits: string): string => {
  let sum = 0

  for (let index = 0; index < dataDigits.length; ++index) {
    const digit = Number(dataDigits[index])
    const weight = (dataDigits.length - 1 - index) % 2 === 0 ? 3 : 1
    sum += digit * weight
  }

  return String((10 - (sum % 10)) % 10)
}

const isValidGtinCheckDigit = (digits: string): boolean =>
  digits[digits.length - 1] === getGtinCheckDigit(digits.slice(0, -1))

const isFixedLengthGtin = (length: number): boolean =>
  length === 8 || length === 12 || length === 13 || length === 14

/**
 * Expands a UPC-E barcode into a UPC-A barcode.
 * @param numberSystem - The number system of the barcode.
 * @param compactDigits - The compact digits of the barcode.
 * @returns The expanded UPC-A barcode.
 */
const expandUpcEBody = (
  numberSystem: string,
  compactDigits: string,
): string => {
  const lastDigit = compactDigits[5]

  if (lastDigit === '0' || lastDigit === '1' || lastDigit === '2') {
    return (
      numberSystem +
      compactDigits.slice(0, 2) +
      lastDigit +
      '0000' +
      compactDigits.slice(2, 5)
    )
  }

  if (lastDigit === '3') {
    return (
      numberSystem +
      compactDigits.slice(0, 3) +
      '00000' +
      compactDigits.slice(3, 5)
    )
  }

  if (lastDigit === '4') {
    return numberSystem + compactDigits.slice(0, 4) + '00000' + compactDigits[4]
  }

  return numberSystem + compactDigits.slice(0, 5) + '0000' + lastDigit
}

const getExpandedUpcEBody = (digits: string): string | null => {
  if (digits.length === 6) {
    return expandUpcEBody('0', digits)
  }

  if (digits.length === 7 && (digits[0] === '0' || digits[0] === '1')) {
    return expandUpcEBody(digits[0], digits.slice(1))
  }

  if (digits.length === 8 && (digits[0] === '0' || digits[0] === '1')) {
    return expandUpcEBody(digits[0], digits.slice(1, 7))
  }

  return null
}

/**
 * Expands a UPC-E barcode into a UPC-A barcode.
 * @param digits - The digits of the barcode.
 * @returns The expanded UPC-A barcode.
 */
const expandUpcEToUpcA = (digits: string): string => {
  const body = getExpandedUpcEBody(digits)
  if (!body) {
    return digits
  }

  return body + getGtinCheckDigit(body)
}

const isValidUpcECheckDigit = (digits: string): boolean => {
  const body = getExpandedUpcEBody(digits)
  if (!body || digits.length !== 8) {
    return false
  }

  return digits[7] === getGtinCheckDigit(body)
}

const validateBarcode = (
  barcode: string,
  options: ValidateBarcodeOptions = {},
): BarcodeValidationResult => {
  const trimmed = barcode.trim()

  if (options.isUpcE && trimmed.length === 8) {
    if (!/^\d{8}$/.test(trimmed) || !isValidUpcECheckDigit(trimmed)) {
      return {
        status: 'invalid',
        message: VALIDATION_INVALID_BARCODE,
      }
    }
  }

  const shouldExpandUpcE =
    options.isUpcE || trimmed.length === 6 || trimmed.length === 7
  const expanded = shouldExpandUpcE ? expandUpcEToUpcA(trimmed) : trimmed

  if (!/^\d{8,14}$/.test(expanded)) {
    return {
      status: 'invalid',
      message: VALIDATION_INVALID_BARCODE,
    }
  }

  if (isFixedLengthGtin(expanded.length) && !isValidGtinCheckDigit(expanded)) {
    return {
      status: 'invalid',
      message: VALIDATION_INVALID_BARCODE,
    }
  }

  return {
    status: 'valid',
    barcode: expanded,
  }
}

export { validateBarcode, type BarcodeValidationResult }
