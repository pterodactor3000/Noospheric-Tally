import { describe, expect, test } from 'vitest'

import {
  getCategoryRefKey,
  getCategoryRpcArgs,
  parseCategoryRefKey,
  type ItemCategoryRef,
} from './item-category-ref'

const CUSTOM_CATEGORY_ID = '0b9c3f2e-5a1d-4c7e-8f46-2d1a9b7e3c50'

const builtInRef: ItemCategoryRef = { kind: 'built-in', category: 'pet-food' }
const customRef: ItemCategoryRef = {
  kind: 'custom',
  categoryId: CUSTOM_CATEGORY_ID,
}

const countSetRpcArgs = (ref: ItemCategoryRef): number => {
  const args = getCategoryRpcArgs(ref)
  return [args.category, args.customCategoryId].filter((value) => value !== null)
    .length
}

describe('getCategoryRefKey', () => {
  test('round-trips a built-in category', () => {
    expect(parseCategoryRefKey(getCategoryRefKey(builtInRef))).toEqual(builtInRef)
  })

  test('round-trips a custom category', () => {
    expect(parseCategoryRefKey(getCategoryRefKey(customRef))).toEqual(customRef)
    expect(getCategoryRefKey(customRef)).toEqual(`custom-${CUSTOM_CATEGORY_ID}`)
  })
})

describe('parseCategoryRefKey', () => {
  test('returns null for a custom- prefix with a non-UUID suffix', () => {
    expect(parseCategoryRefKey('custom-not-a-uuid')).toEqual(null)
  })

  test('returns null for an unknown string', () => {
    expect(parseCategoryRefKey('drinks')).toEqual(null)
  })

  test('returns null for null', () => {
    expect(parseCategoryRefKey(null)).toEqual(null)
  })
})

describe('getCategoryRpcArgs', () => {
  test('sets the built-in category and leaves the custom id empty', () => {
    expect(getCategoryRpcArgs(builtInRef)).toEqual({
      category: 'pet-food',
      customCategoryId: null,
    })
    expect(countSetRpcArgs(builtInRef)).toEqual(1)
  })

  test('sets the custom id and leaves the built-in category empty', () => {
    expect(getCategoryRpcArgs(customRef)).toEqual({
      category: null,
      customCategoryId: CUSTOM_CATEGORY_ID,
    })
    expect(countSetRpcArgs(customRef)).toEqual(1)
  })
})
