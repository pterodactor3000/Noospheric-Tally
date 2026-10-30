import { describe, expect, test } from 'vitest'

import {
  SCAN_DIRECTION_STOCKING,
  SCAN_DIRECTION_STORAGE_KEY,
  SCAN_DIRECTION_USING,
  readScanDirection,
  resolveScanDisplay,
  writeScanDirection,
  type ScanDirectionStorage,
} from './scan-direction'

const createMemoryStorage = (
  initialValue?: string,
): ScanDirectionStorage => {
  const values = new Map<string, string>()
  if (initialValue !== undefined) {
    values.set(SCAN_DIRECTION_STORAGE_KEY, initialValue)
  }

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
  }
}

describe('readScanDirection', () => {
  test('returns using when the key is missing', () => {
    const storage = createMemoryStorage()

    expect(readScanDirection(storage)).toEqual(SCAN_DIRECTION_USING)
  })

  test('returns using when the stored value is using', () => {
    const storage = createMemoryStorage('using')

    expect(readScanDirection(storage)).toEqual(SCAN_DIRECTION_USING)
  })

  test('returns using when the stored value is an empty string', () => {
    const storage = createMemoryStorage('')

    expect(readScanDirection(storage)).toEqual(SCAN_DIRECTION_USING)
  })

  test('returns using when the stored value is not a known direction', () => {
    const storage = createMemoryStorage('Stocking')

    expect(readScanDirection(storage)).toEqual(SCAN_DIRECTION_USING)
  })

  test('returns stocking when the stored value is stocking', () => {
    const storage = createMemoryStorage('stocking')

    expect(readScanDirection(storage)).toEqual(SCAN_DIRECTION_STOCKING)
  })
})

describe('writeScanDirection', () => {
  test('reads back stocking after writing stocking', () => {
    const storage = createMemoryStorage()

    writeScanDirection(storage, SCAN_DIRECTION_STOCKING)

    expect(readScanDirection(storage)).toEqual(SCAN_DIRECTION_STOCKING)
  })

  test('reads back using after writing using over stocking', () => {
    const storage = createMemoryStorage('stocking')

    writeScanDirection(storage, SCAN_DIRECTION_USING)

    expect(readScanDirection(storage)).toEqual(SCAN_DIRECTION_USING)
  })
})

describe('resolveScanDisplay', () => {
  const stock = { name: 'Lho sticks', quantity: 4, minimumQuantity: 3 }

  test('returns quantity when stocking with a stock row', () => {
    expect(resolveScanDisplay(SCAN_DIRECTION_STOCKING, stock)).toEqual({
      status: 'quantity',
      name: 'Lho sticks',
      quantity: 4,
      stockState: 'warning',
    })
  })

  test('returns quantity 0 when stocking with a zero quantity stock row', () => {
    expect(
      resolveScanDisplay(SCAN_DIRECTION_STOCKING, { ...stock, quantity: 0 }),
    ).toEqual({
      status: 'quantity',
      name: 'Lho sticks',
      quantity: 0,
      stockState: 'critical',
    })
  })

  test('returns quantity when using with a stock row', () => {
    expect(resolveScanDisplay(SCAN_DIRECTION_USING, stock)).toEqual({
      status: 'quantity',
      name: 'Lho sticks',
      quantity: 4,
      stockState: 'warning',
    })
  })

  test('returns quantity 0 when using with a zero quantity stock row', () => {
    expect(
      resolveScanDisplay(SCAN_DIRECTION_USING, { ...stock, quantity: 0 }),
    ).toEqual({
      status: 'quantity',
      name: 'Lho sticks',
      quantity: 0,
      stockState: 'critical',
    })
  })

  test.each([
    { direction: SCAN_DIRECTION_STOCKING, quantity: 3, stockState: 'critical' },
    { direction: SCAN_DIRECTION_STOCKING, quantity: 4, stockState: 'warning' },
    { direction: SCAN_DIRECTION_STOCKING, quantity: 5, stockState: 'warning' },
    { direction: SCAN_DIRECTION_STOCKING, quantity: 6, stockState: 'in-stock' },
    { direction: SCAN_DIRECTION_USING, quantity: 3, stockState: 'critical' },
    { direction: SCAN_DIRECTION_USING, quantity: 4, stockState: 'warning' },
    { direction: SCAN_DIRECTION_USING, quantity: 5, stockState: 'warning' },
    { direction: SCAN_DIRECTION_USING, quantity: 6, stockState: 'in-stock' },
  ] as const)(
    'returns $stockState when $direction leaves quantity $quantity with a minimum of 3',
    ({ direction, quantity, stockState }) => {
      expect(
        resolveScanDisplay(direction, { ...stock, quantity }),
      ).toEqual({
        status: 'quantity',
        name: 'Lho sticks',
        quantity,
        stockState,
      })
    },
  )

  test('returns create when stocking with a null stock row', () => {
    expect(resolveScanDisplay(SCAN_DIRECTION_STOCKING, null)).toEqual({
      status: 'create',
    })
  })

  test('returns create when using with a null stock row', () => {
    expect(resolveScanDisplay(SCAN_DIRECTION_USING, null)).toEqual({
      status: 'create',
    })
  })
})
