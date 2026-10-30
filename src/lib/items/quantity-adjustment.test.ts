import { describe, expect, test } from 'vitest'

import { isQuantityAdjustment } from './quantity-adjustment'

describe('isQuantityAdjustment', () => {
  test.each([1, -1])('accepts %s', (value) => {
    expect(isQuantityAdjustment(value)).toEqual(true)
  })

  test.each([0, 2, -2, 1.5, Number.NaN, '1', null, undefined])(
    'rejects %s',
    (value) => {
      expect(isQuantityAdjustment(value)).toEqual(false)
    },
  )
})
