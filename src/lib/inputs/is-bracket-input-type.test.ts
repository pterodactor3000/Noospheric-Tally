import { describe, expect, test } from 'vitest'

import { isBracketInputType } from './is-bracket-input-type'

describe('isBracketInputType', () => {
  test.each([undefined, 'text', 'search', 'email', 'password'])(
    'returns true when the type is %s',
    (type) => {
      expect(isBracketInputType(type)).toEqual(true)
    },
  )

  test.each(['file', 'hidden', 'checkbox', 'radio', 'number'])(
    'returns false when the type is %s',
    (type) => {
      expect(isBracketInputType(type)).toEqual(false)
    },
  )

  test('returns false when the type is an empty string', () => {
    expect(isBracketInputType('')).toEqual(false)
  })
})
