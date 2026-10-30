import { describe, expect, test } from 'vitest'

import { readHabUnitTallyLine } from './load-hab-unit-items'

const ITEM_ID = '7d4e1a90-3b2c-4f58-9a6d-8e0c5b1f2a37'

describe('readHabUnitTallyLine', () => {
  test('returns a line with the minimum quantity for a valid row', () => {
    expect(
      readHabUnitTallyLine({
        item_id: ITEM_ID,
        name: 'Wet food',
        quantity: 4,
        minimum_quantity: 3,
      }),
    ).toEqual({
      itemId: ITEM_ID,
      name: 'Wet food',
      quantity: 4,
      minimumQuantity: 3,
    })
  })

  test('returns a line when the minimum quantity is 0', () => {
    expect(
      readHabUnitTallyLine({
        item_id: ITEM_ID,
        name: 'Wet food',
        quantity: 0,
        minimum_quantity: 0,
      }),
    ).toEqual({
      itemId: ITEM_ID,
      name: 'Wet food',
      quantity: 0,
      minimumQuantity: 0,
    })
  })

  test.each([
    ['a missing minimum_quantity', { item_id: ITEM_ID, name: 'Wet food', quantity: 4 }],
    [
      'a float minimum_quantity',
      { item_id: ITEM_ID, name: 'Wet food', quantity: 4, minimum_quantity: 2.5 },
    ],
    [
      'a string minimum_quantity',
      { item_id: ITEM_ID, name: 'Wet food', quantity: 4, minimum_quantity: '3' },
    ],
    ['null', null],
    ['a string row', 'row'],
    ['a number row', 7],
  ])('returns null for %s', (_label, row) => {
    expect(readHabUnitTallyLine(row)).toEqual(null)
  })
})
