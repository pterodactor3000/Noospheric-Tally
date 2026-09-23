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
 * Returns the GS1 check digit for GTIN digits that do not include a check digit.
 * @param dataDigits - Barcode digits without the check digit.
 * @returns The one-digit GS1 check value.
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

/**
 * Returns true if the last digit is the GS1 GTIN check digit for the rest of the code.
 * @param digits - Full barcode digits, last digit included.
 * @returns True if the last digit matches the GS1 check digit.
 */
const isValidGtinCheckDigit = (digits: string): boolean =>
  digits[digits.length - 1] === getGtinCheckDigit(digits.slice(0, -1))

/**
 * Returns true if the barcode length is 8, 12, 13, or 14.
 * @param length - Digit count of the barcode.
 * @returns True if the length is 8, 12, 13, or 14.
 */
const isFixedLengthGtin = (length: number): boolean =>
  length === 8 || length === 12 || length === 13 || length === 14

/**
 * Returns the 11-digit UPC-A body for a number system and six compact UPC-E digits.
 * @param numberSystem - UPC number system digit, 0 or 1.
 * @param compactDigits - The six compact UPC-E digits.
 * @returns The 11-digit UPC-A body with no check digit.
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

/**
 * Returns the 11-digit UPC-A body for 6, 7, or 8 digit UPC-E input.
 * @param digits - UPC-E digits.
 * @returns The 11-digit UPC-A body, or null if the input is not UPC-E.
 */
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
 * Returns a 12-digit UPC-A code for UPC-E input.
 * @param digits - UPC-E digits.
 * @returns The 12-digit UPC-A code, or the original digits if they are not UPC-E.
 */
const expandUpcEToUpcA = (digits: string): string => {
  const body = getExpandedUpcEBody(digits)
  if (!body) {
    return digits
  }

  return body + getGtinCheckDigit(body)
}

/**
 * Returns true if the last digit of an 8-digit UPC-E code matches the expanded UPC-A check digit.
 * @param digits - Eight UPC-E digits, last digit included.
 * @returns True if the last digit matches the UPC-A check digit of the expansion.
 */
const isValidUpcECheckDigit = (digits: string): boolean => {
  const body = getExpandedUpcEBody(digits)
  if (!body || digits.length !== 8) {
    return false
  }

  return digits[7] === getGtinCheckDigit(body)
}

/**
 * Trims and validates a barcode, expanding UPC-E input to UPC-A when needed.
 *
 * Six- and seven-digit values are treated as UPC-E. Eight-digit values are
 * treated as GTIN-8 unless `options.isUpcE` is true. Numeric values from 8 to
 * 14 digits are accepted, with check digits verified for lengths 8, 12, 13,
 * and 14.
 *
 * @param barcode - Barcode text to normalize and validate.
 * @param options.isUpcE - Whether an eight-digit value came from a UPC-E scan.
 * @returns A valid result with the normalized barcode, or an invalid result.
 */
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

  const isUnmarkedUpcE =
    !options.isUpcE &&
    /^\d{8}$/.test(trimmed) &&
    !isValidGtinCheckDigit(trimmed) &&
    isValidUpcECheckDigit(trimmed)

  const shouldExpandUpcE =
    options.isUpcE ||
    isUnmarkedUpcE ||
    trimmed.length === 6 ||
    trimmed.length === 7
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
