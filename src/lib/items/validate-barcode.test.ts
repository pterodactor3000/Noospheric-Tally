import { describe, expect, test } from 'vitest'
import { validateBarcode } from './validate-barcode'

const invalidResponse = {
  status: 'invalid',
  message: 'Barcode does not match restrictions',
}

describe('validateBarcode', () => {
  test('returns an invalid result when the barcode is empty', () => {
    expect(validateBarcode('')).toEqual(invalidResponse)
  })

  test('returns an invalid result when the barcode is whitespace-only', () => {
    expect(validateBarcode('   ')).toEqual(invalidResponse)
  })

  test('returns an invalid result when the barcode contains a non-digit', () => {
    expect(validateBarcode('3234567a')).toEqual(invalidResponse)
  })

  test('returns an invalid result when the barcode is too long', () => {
    expect(validateBarcode('123456789012345')).toEqual(invalidResponse)
  })

  test('returns a valid result when the barcode is an EAN-13', () => {
    expect(validateBarcode('3017620422003')).toEqual({
      status: 'valid',
      barcode: '3017620422003',
    })
  })

  test('expands a 6-digit UPC-E code to UPC-A', () => {
    expect(validateBarcode('425261')).toEqual({
      status: 'valid',
      barcode: '042100005264',
    })
  })

  test('expands an 8-digit UPC-E code to UPC-A', () => {
    expect(validateBarcode('04252614')).toEqual({
      status: 'valid',
      barcode: '042100005264',
    })
  })
})
