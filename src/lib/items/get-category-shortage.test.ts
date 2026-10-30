import { describe, expect, test } from 'vitest'

import { getCategoryShortage } from './get-category-shortage'

describe('getCategoryShortage', () => {
  test('returns null for no lines', () => {
    expect(getCategoryShortage([])).toEqual(null)
  })

  test('returns null when every line is in stock', () => {
    expect(
      getCategoryShortage([
        { quantity: 6, minimumQuantity: 3 },
        { quantity: 10, minimumQuantity: 4 },
      ]),
    ).toEqual(null)
  })

  test('returns warning for a warning line', () => {
    expect(
      getCategoryShortage([{ quantity: 4, minimumQuantity: 3 }]),
    ).toEqual('warning')
  })

  test('returns critical for a critical line', () => {
    expect(
      getCategoryShortage([{ quantity: 1, minimumQuantity: 3 }]),
    ).toEqual('critical')
  })

  test('returns critical when a warning and a critical line mix', () => {
    expect(
      getCategoryShortage([
        { quantity: 4, minimumQuantity: 3 },
        { quantity: 1, minimumQuantity: 3 },
      ]),
    ).toEqual('critical')
  })

  test('treats a count equal to the minimum as critical', () => {
    expect(
      getCategoryShortage([{ quantity: 3, minimumQuantity: 3 }]),
    ).toEqual('critical')
  })
})
