import { describe, expect, test } from 'vitest'

import { validateHouseholdQuantity } from './validate-household-quantity'

const invalidResponse = {
  status: 'invalid',
  message: 'Count must be a whole number from 0 to 99.',
}

describe('validateHouseholdQuantity', () => {
  test('rejects an empty count', () => {
    expect(validateHouseholdQuantity('')).toEqual(invalidResponse)
  })

  test('rejects a count that is only whitespace', () => {
    expect(validateHouseholdQuantity('   ')).toEqual(invalidResponse)
  })

  test('rejects a negative count', () => {
    expect(validateHouseholdQuantity('-1')).toEqual(invalidResponse)
  })

  test('rejects a fractional count', () => {
    expect(validateHouseholdQuantity('1.5')).toEqual(invalidResponse)
  })

  test('accepts 0', () => {
    expect(validateHouseholdQuantity('0')).toEqual({
      status: 'valid',
      quantity: 0,
    })
  })

  test('accepts a whole number inside the range', () => {
    expect(validateHouseholdQuantity('42')).toEqual({
      status: 'valid',
      quantity: 42,
    })
  })

  test('accepts the upper bound', () => {
    expect(validateHouseholdQuantity('99')).toEqual({
      status: 'valid',
      quantity: 99,
    })
  })

  test('rejects 100', () => {
    expect(validateHouseholdQuantity('100')).toEqual(invalidResponse)
  })

  test('rejects 999999', () => {
    expect(validateHouseholdQuantity('999999')).toEqual(invalidResponse)
  })

  test('rejects a count above the upper bound', () => {
    expect(validateHouseholdQuantity('1000000')).toEqual(invalidResponse)
  })
})
