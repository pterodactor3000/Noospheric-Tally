import { describe, expect, test } from 'vitest'

import {
  ITEM_CATEGORIES,
  ITEM_CATEGORY_LABELS,
  isItemCategory,
} from './item-category'

describe('isItemCategory', () => {
  test('lists the categories in panel order', () => {
    expect(ITEM_CATEGORIES).toEqual([
      'pet-food',
      'food',
      'beauty',
      'other',
      'uncategorized',
    ])
  })

  test('returns true for each stored category value', () => {
    expect(ITEM_CATEGORIES.map((category) => isItemCategory(category))).toEqual([
      true,
      true,
      true,
      true,
      true,
    ])
  })

  test('returns false for an unknown string', () => {
    expect(isItemCategory('drinks')).toEqual(false)
  })

  test('returns false for an empty string', () => {
    expect(isItemCategory('')).toEqual(false)
  })

  test('returns false for null, undefined, and a number', () => {
    expect([
      isItemCategory(null),
      isItemCategory(undefined),
      isItemCategory(1),
    ]).toEqual([false, false, false])
  })

  test('labels every category', () => {
    expect(ITEM_CATEGORY_LABELS).toEqual({
      'pet-food': 'Pet food',
      food: 'Food',
      beauty: 'Beauty',
      other: 'Other',
      uncategorized: 'Uncategorized',
    })
  })
})
