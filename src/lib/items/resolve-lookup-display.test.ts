import { describe, expect, test } from 'vitest'

import { resolveLookupDisplay } from './resolve-lookup-display'
import type { ScanStock } from './scan-direction'

const createStock = (quantity: number, minimumQuantity = 3): ScanStock => ({
  name: 'Lho sticks',
  quantity,
  minimumQuantity,
})

describe('resolveLookupDisplay', () => {
  test('returns blocked when the household row is null', () => {
    expect(resolveLookupDisplay(null)).toEqual({ status: 'blocked' })
  })

  test('returns found with critical when the quantity is 0', () => {
    expect(resolveLookupDisplay(createStock(0))).toEqual({
      status: 'found',
      name: 'Lho sticks',
      quantity: 0,
      stockState: 'critical',
    })
  })

  test('returns found with critical when the quantity equals the minimum', () => {
    expect(resolveLookupDisplay(createStock(3, 3))).toEqual({
      status: 'found',
      name: 'Lho sticks',
      quantity: 3,
      stockState: 'critical',
    })
  })

  test('returns found with warning when the quantity is one above the minimum', () => {
    expect(resolveLookupDisplay(createStock(4, 3))).toEqual({
      status: 'found',
      name: 'Lho sticks',
      quantity: 4,
      stockState: 'warning',
    })
  })

  test('returns found with in-stock when the quantity is twice the minimum', () => {
    expect(resolveLookupDisplay(createStock(6, 3))).toEqual({
      status: 'found',
      name: 'Lho sticks',
      quantity: 6,
      stockState: 'in-stock',
    })
  })

  test('does not change the input stock', () => {
    const stock = createStock(4, 3)
    const before = {
      name: stock.name,
      quantity: stock.quantity,
      minimumQuantity: stock.minimumQuantity,
    }

    resolveLookupDisplay(stock)

    expect(stock).toEqual(before)
  })
})
