import { describe, expect, test } from 'vitest'

import { validateCategoryName } from './validate-category-name'

const lengthMessage = 'Category name does not match length restrictions'

const builtInMessage = 'Category name matches a built-in category'

describe('validateCategoryName', () => {
  test('returns a valid result when the name is valid', () => {
    expect(validateCategoryName('Cleaning')).toEqual({
      status: 'valid',
      name: 'Cleaning',
    })
  })

  test('returns a valid result when the name is trimmed', () => {
    expect(validateCategoryName('  Cleaning  ')).toEqual({
      status: 'valid',
      name: 'Cleaning',
    })
  })

  test('returns an invalid result when the name is empty', () => {
    expect(validateCategoryName('')).toEqual({
      status: 'invalid',
      message: lengthMessage,
    })
  })

  test('returns an invalid result when the name is whitespace', () => {
    expect(validateCategoryName('   ')).toEqual({
      status: 'invalid',
      message: lengthMessage,
    })
  })

  test('returns a valid result when the name is one character', () => {
    expect(validateCategoryName('A')).toEqual({
      status: 'valid',
      name: 'A',
    })
  })

  test('returns a valid result when the name is 40 characters', () => {
    const name = 'a'.repeat(40)
    expect(validateCategoryName(name)).toEqual({ status: 'valid', name })
  })

  test('returns an invalid result when the name is 41 characters', () => {
    expect(validateCategoryName('a'.repeat(41))).toEqual({
      status: 'invalid',
      message: lengthMessage,
    })
  })

  test('returns an invalid result when the name is a built-in label in any case', () => {
    expect(validateCategoryName('FOOD')).toEqual({
      status: 'invalid',
      message: builtInMessage,
    })
    expect(validateCategoryName('  Pet food  ')).toEqual({
      status: 'invalid',
      message: builtInMessage,
    })
    expect(validateCategoryName('beauty')).toEqual({
      status: 'invalid',
      message: builtInMessage,
    })
    expect(validateCategoryName('Other')).toEqual({
      status: 'invalid',
      message: builtInMessage,
    })
    expect(validateCategoryName('UNCATEGORIZED')).toEqual({
      status: 'invalid',
      message: builtInMessage,
    })
  })

  test('returns a valid result when the name is Pet foods', () => {
    expect(validateCategoryName('Pet foods')).toEqual({
      status: 'valid',
      name: 'Pet foods',
    })
  })
})
