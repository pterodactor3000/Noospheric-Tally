import { describe, expect, test } from 'vitest'
import { validateMinimumQuantity } from './validate-minimum-quantity'

const invalidResponse = {
  status: 'invalid',
  message: 'Minimum must be a whole number from 0 to 999.',
}

describe('validateMinimumQuantity', () => {
  test('returns the default of 3 when the value is blank', () => {
    expect(validateMinimumQuantity('')).toEqual({
      status: 'valid',
      minimumQuantity: 3,
    })
  })

  test('returns the default of 3 when the value is whitespace-only', () => {
    expect(validateMinimumQuantity('   ')).toEqual({
      status: 'valid',
      minimumQuantity: 3,
    })
  })

  test.each([
    ['0', 0],
    ['7', 7],
    [' 12 ', 12],
    ['007', 7],
    ['999', 999],
  ])('returns a valid result for %j', (rawValue, minimumQuantity) => {
    expect(validateMinimumQuantity(rawValue)).toEqual({
      status: 'valid',
      minimumQuantity,
    })
  })

  test.each(['-1', '1000', '2.5', '1e2', 'abc', '+5', '0x10', '1 2', '٣'])(
    'returns an invalid result for %j',
    (rawValue) => {
      expect(validateMinimumQuantity(rawValue)).toEqual(invalidResponse)
    },
  )
})
