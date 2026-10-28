import { describe, expect, test } from 'vitest'

import {
  SCAN_DIRECTION_STOCKING,
  SCAN_DIRECTION_STORAGE_KEY,
  SCAN_DIRECTION_USING,
  readScanDirection,
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
