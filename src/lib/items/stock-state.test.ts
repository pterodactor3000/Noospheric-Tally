import { describe, expect, test } from 'vitest'

import {
  DEFAULT_MINIMUM_QUANTITY,
  getStockState,
  MINIMUM_QUANTITY_MAX,
  MINIMUM_QUANTITY_MIN,
  STOCK_STATE_LABELS,
} from './stock-state'

describe('stock rule constants', () => {
  test('pins the default minimum at 3', () => {
    expect(DEFAULT_MINIMUM_QUANTITY).toEqual(3)
  })

  test('pins the minimum range at 0 through 999', () => {
    expect([MINIMUM_QUANTITY_MIN, MINIMUM_QUANTITY_MAX]).toEqual([0, 999])
  })
})

describe('getStockState', () => {
  test.each([
    [0, 3, 'critical'],
    [3, 3, 'critical'],
    [4, 3, 'warning'],
    [5, 3, 'warning'],
    [6, 3, 'in-stock'],
    [50, 3, 'in-stock'],
    [0, 0, 'critical'],
    [1, 0, 'in-stock'],
    [1997, 999, 'warning'],
    [1998, 999, 'in-stock'],
  ])(
    'returns the band for quantity %i with minimum %i',
    (quantity, minimumQuantity, expectedState) => {
      expect(getStockState(quantity, minimumQuantity)).toEqual(expectedState)
    },
  )
})

describe('STOCK_STATE_LABELS', () => {
  test('maps each state to its label text', () => {
    expect(STOCK_STATE_LABELS).toEqual({
      critical: 'CRITICAL',
      warning: 'WARNING',
      'in-stock': 'IN STOCK',
    })
  })
})
