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

  test('returns an invalid result when the EAN-13 check digit is wrong', () => {
    expect(validateBarcode('3017620422004')).toEqual(invalidResponse)
  })

  test('returns a valid result when the barcode is a UPC-A', () => {
    expect(validateBarcode('042100005264')).toEqual({
      status: 'valid',
      barcode: '042100005264',
    })
  })

  test('returns an invalid result when the UPC-A check digit is wrong', () => {
    expect(validateBarcode('042100005265')).toEqual(invalidResponse)
  })

  test('returns a valid result when the barcode is a GTIN-14', () => {
    expect(validateBarcode('03017620422003')).toEqual({
      status: 'valid',
      barcode: '03017620422003',
    })
  })

  test('returns an invalid result when the GTIN-14 check digit is wrong', () => {
    expect(validateBarcode('03017620422004')).toEqual(invalidResponse)
  })

  test('returns a valid result when the barcode is 11 digits', () => {
    expect(validateBarcode('12345678901')).toEqual({
      status: 'valid',
      barcode: '12345678901',
    })
  })

  test('expands a 6-digit UPC-E code to UPC-A', () => {
    expect(validateBarcode('425261')).toEqual({
      status: 'valid',
      barcode: '042100005264',
    })
  })

  test('preserves an 8-digit barcode that starts with 0', () => {
    expect(validateBarcode('01234565')).toEqual({
      status: 'valid',
      barcode: '01234565',
    })
  })

  test('preserves an 8-digit barcode that starts with 1', () => {
    expect(validateBarcode('14252617')).toEqual({
      status: 'valid',
      barcode: '14252617',
    })
  })

  test('returns an invalid result when the GTIN-8 check digit is wrong', () => {
    expect(validateBarcode('04252614')).toEqual(invalidResponse)
  })

  test('expands an 8-digit UPC-E code to UPC-A when marked as UPC-E', () => {
    expect(validateBarcode('04252614', { isUpcE: true })).toEqual({
      status: 'valid',
      barcode: '042100005264',
    })
  })

  test('returns an invalid result when the UPC-E check digit is wrong', () => {
    expect(validateBarcode('04252615', { isUpcE: true })).toEqual(
      invalidResponse,
    )
  })
})
