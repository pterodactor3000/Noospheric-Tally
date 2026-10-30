import { describe, expect, test } from 'vitest'

import { sortTallyLines } from './sort-tally-lines'

interface SampleLine {
  readonly name: string
  readonly quantity: number
}

const lines: readonly SampleLine[] = [
  { name: 'Cinnamon', quantity: 0 },
  { name: 'Salt', quantity: 2 },
  { name: 'Pepper', quantity: 4 },
  { name: 'Nutmeg', quantity: 0 },
  { name: 'Basil', quantity: 2 },
]

describe('sortTallyLines', () => {
  test('sorts by name and keeps a count of 0 at the bottom', () => {
    expect(sortTallyLines(lines, 'name')).toEqual([
      { name: 'Basil', quantity: 2 },
      { name: 'Pepper', quantity: 4 },
      { name: 'Salt', quantity: 2 },
      { name: 'Cinnamon', quantity: 0 },
      { name: 'Nutmeg', quantity: 0 },
    ])
  })

  test('sorts by count and still keeps a count of 0 at the bottom', () => {
    expect(sortTallyLines(lines, 'count')).toEqual([
      { name: 'Basil', quantity: 2 },
      { name: 'Salt', quantity: 2 },
      { name: 'Pepper', quantity: 4 },
      { name: 'Cinnamon', quantity: 0 },
      { name: 'Nutmeg', quantity: 0 },
    ])
  })

  test('returns an empty array when the list is empty', () => {
    expect(sortTallyLines([], 'name')).toEqual([])
  })

  test('leaves the input array unchanged', () => {
    const input: SampleLine[] = [
      { name: 'Salt', quantity: 1 },
      { name: 'Pepper', quantity: 0 },
    ]
    const snapshot = [...input]
    Object.freeze(input)

    const result = sortTallyLines(input, 'name')

    expect(result).toEqual([
      { name: 'Salt', quantity: 1 },
      { name: 'Pepper', quantity: 0 },
    ])
    expect(result).not.toBe(input)
    expect(input).toEqual(snapshot)
  })
})
