import { describe, expect, test } from 'vitest'
import { validateHabUnitName } from './validate-hab-unit-name'

const invalidResponse = {
  status: 'invalid',
  message: 'Hab-unit name does not match length requirements.',
}

const validResponse = {
  status: 'valid',
  name: '',
}

describe('validateHabUnitName', () => {
  test('returns an invalid result when the name is empty', () => {
    const testValue = ''

    const result = validateHabUnitName(testValue)
    expect(result).toStrictEqual(invalidResponse)
  })

  test('returns an invalid result when the name is whitespace-only', () => {
    const testValue = '   '

    const result = validateHabUnitName(testValue)
    expect(result).toStrictEqual(invalidResponse)
  })

  test('returns a valid result when the name is valid', () => {
    const testValue = 'A valid name, my lord!'

    const result = validateHabUnitName(testValue)
    expect(result).toStrictEqual({ ...validResponse, name: testValue })
  })

  test('returns a valid result when the name is at the length limit', () => {
    const testValue =
      'aslkdjflkasjdflkajsdflkjasdoifuqweoiruqowjdflkasjoripuqweoirujqlskdjrfqwe1234567'

    const result = validateHabUnitName(testValue)
    expect(result).toStrictEqual({ ...validResponse, name: testValue })
  })

  test('returns an invalid result when the name is over the length limit', () => {
    const testValue =
      'aslkdjflkasjdflkajsdflkjasdoifuqweoiruqowjdflkasjoripuqweoirujqlskdjrfqwe123456789157198yrfjkhasdbfiuyq314triquwgfdc'

    const result = validateHabUnitName(testValue)
    expect(result).toStrictEqual(invalidResponse)
  })
})
