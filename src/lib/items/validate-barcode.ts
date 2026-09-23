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
 * Calculates the check digit for a UPC-A barcode.
 * @param digits - The digits of the barcode.
 * @returns The check digit.
 */
const getUpcACheckDigit = (digits: string): string => {
  let sum = 0

  for (let index = 0; index < 11; ++index) {
    const digit = Number(digits[index])
    sum += index % 2 === 0 ? digit * 3 : digit
  }

  return String((10 - (sum % 10)) % 10)
}

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

/**
 * Expands a UPC-E barcode into a UPC-A barcode.
 * @param digits - The digits of the barcode.
 * @returns The expanded UPC-A barcode.
 */
const expandUpcEToUpcA = (digits: string): string => {
  if (digits.length === 6) {
    const body = expandUpcEBody('0', digits)
    return body + getUpcACheckDigit(body)
  }

  if (digits.length === 7 && (digits[0] === '0' || digits[0] === '1')) {
    const body = expandUpcEBody(digits[0], digits.slice(1))
    return body + getUpcACheckDigit(body)
  }

  if (digits.length === 8 && (digits[0] === '0' || digits[0] === '1')) {
    const body = expandUpcEBody(digits[0], digits.slice(1, 7))
    return body + getUpcACheckDigit(body)
  }

  return digits
}

const validateBarcode = (
  barcode: string,
  options: ValidateBarcodeOptions = {},
): BarcodeValidationResult => {
  const trimmed = barcode.trim()
  const shouldExpandUpcE =
    options.isUpcE || trimmed.length === 6 || trimmed.length === 7
  const expanded = shouldExpandUpcE ? expandUpcEToUpcA(trimmed) : trimmed

  if (!/^\d{8,14}$/.test(expanded)) {
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
