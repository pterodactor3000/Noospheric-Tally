import { describe, expect, test } from 'vitest'

import {
  buildDefaultHabUnitName,
  readRandomHabUnitSuffix,
} from './build-default-hab-unit-name'

describe('buildDefaultHabUnitName', () => {
  test('returns Hab-unit#000 when the suffix is 0', () => {
    expect(buildDefaultHabUnitName(0)).toEqual('Hab-unit#000')
  })

  test('pads a suffix below 100 to three digits', () => {
    expect(buildDefaultHabUnitName(42)).toEqual('Hab-unit#042')
  })

  test('returns Hab-unit#999 when the suffix is 999', () => {
    expect(buildDefaultHabUnitName(999)).toEqual('Hab-unit#999')
  })

  test('rejects a suffix outside 0 to 999', () => {
    expect(() => buildDefaultHabUnitName(-1)).toThrow(
      'buildDefaultHabUnitName rejected suffix -1',
    )
    expect(() => buildDefaultHabUnitName(1000)).toThrow(
      'buildDefaultHabUnitName rejected suffix 1000',
    )
    expect(() => buildDefaultHabUnitName(1.5)).toThrow(
      'buildDefaultHabUnitName rejected suffix 1.5',
    )
  })
})

describe('readRandomHabUnitSuffix', () => {
  test('returns an integer from 0 through 999', () => {
    const suffix = readRandomHabUnitSuffix()

    expect(Number.isInteger(suffix)).toEqual(true)
    expect(suffix).toBeGreaterThanOrEqual(0)
    expect(suffix).toBeLessThan(1000)
  })
})
