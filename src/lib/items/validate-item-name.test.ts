import { describe, expect, test } from 'vitest'
import { validateItemName } from './validate-item-name'

const invalidResponse = {
  status: 'invalid',
  message: 'Item does not match length restrictions',
}

describe('validateItemName', () => {
  test('returns an invalid result when the name is empty', () => {
    expect(validateItemName('')).toEqual(invalidResponse)
  })

  test('returns an invalid result when the name is whitespace-only', () => {
    expect(validateItemName('   ')).toEqual(invalidResponse)
  })

  test('returns an invalid result when the name is over the length limit', () => {
    expect(validateItemName('a'.repeat(121))).toEqual(invalidResponse)
  })

  test('returns a valid result when the name is at the length limit', () => {
    const name = 'a'.repeat(120)
    expect(validateItemName(name)).toEqual({ status: 'valid', name })
  })

  test('returns a valid result when the name is valid', () => {
    expect(validateItemName('  Wet food  ')).toEqual({
      status: 'valid',
      name: 'Wet food',
    })
  })
})
