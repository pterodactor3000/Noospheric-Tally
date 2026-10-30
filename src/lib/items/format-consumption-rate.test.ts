import { describe, expect, test } from 'vitest'

import { formatConsumptionRate } from './format-consumption-rate'

describe('formatConsumptionRate', () => {
  test('returns No use recorded when the count is 0', () => {
    expect(formatConsumptionRate(0)).toEqual('No use recorded')
  })

  test('returns 1 per week when the count is 1', () => {
    expect(formatConsumptionRate(1)).toEqual('1 per week')
  })

  test('returns 4 per week when the count is 4', () => {
    expect(formatConsumptionRate(4)).toEqual('4 per week')
  })

  test('throws when the count is negative', () => {
    expect(() => formatConsumptionRate(-1)).toThrow(
      'formatConsumptionRate rejected count -1',
    )
  })

  test('throws when the count is not an integer', () => {
    expect(() => formatConsumptionRate(1.5)).toThrow(
      'formatConsumptionRate rejected count 1.5',
    )
  })
})
