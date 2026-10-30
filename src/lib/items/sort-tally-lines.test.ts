import { describe, expect, test } from 'vitest'

import { sortTallyLines, toggleTallySort } from './sort-tally-lines'

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

const nameAscending = { field: 'name' as const, direction: 'asc' as const }
const nameDescending = { field: 'name' as const, direction: 'desc' as const }
const countAscending = { field: 'count' as const, direction: 'asc' as const }
const countDescending = { field: 'count' as const, direction: 'desc' as const }

describe('sortTallyLines', () => {
  test('sorts by name ascending and keeps a count of 0 at the bottom', () => {
    expect(sortTallyLines(lines, nameAscending)).toEqual([
      { name: 'Basil', quantity: 2 },
      { name: 'Pepper', quantity: 4 },
      { name: 'Salt', quantity: 2 },
      { name: 'Cinnamon', quantity: 0 },
      { name: 'Nutmeg', quantity: 0 },
    ])
  })

  test('sorts by name descending and keeps a count of 0 at the bottom', () => {
    expect(sortTallyLines(lines, nameDescending)).toEqual([
      { name: 'Salt', quantity: 2 },
      { name: 'Pepper', quantity: 4 },
      { name: 'Basil', quantity: 2 },
      { name: 'Nutmeg', quantity: 0 },
      { name: 'Cinnamon', quantity: 0 },
    ])
  })

  test('sorts by count ascending and still keeps a count of 0 at the bottom', () => {
    expect(sortTallyLines(lines, countAscending)).toEqual([
      { name: 'Basil', quantity: 2 },
      { name: 'Salt', quantity: 2 },
      { name: 'Pepper', quantity: 4 },
      { name: 'Cinnamon', quantity: 0 },
      { name: 'Nutmeg', quantity: 0 },
    ])
  })

  test('sorts by count descending and still keeps a count of 0 at the bottom', () => {
    expect(sortTallyLines(lines, countDescending)).toEqual([
      { name: 'Pepper', quantity: 4 },
      { name: 'Salt', quantity: 2 },
      { name: 'Basil', quantity: 2 },
      { name: 'Nutmeg', quantity: 0 },
      { name: 'Cinnamon', quantity: 0 },
    ])
  })

  test('returns an empty array when the list is empty', () => {
    expect(sortTallyLines([], nameAscending)).toEqual([])
  })

  test('leaves the input array unchanged', () => {
    const input: SampleLine[] = [
      { name: 'Salt', quantity: 1 },
      { name: 'Pepper', quantity: 0 },
    ]
    const snapshot = [...input]
    Object.freeze(input)

    const result = sortTallyLines(input, nameAscending)

    expect(result).toEqual([
      { name: 'Salt', quantity: 1 },
      { name: 'Pepper', quantity: 0 },
    ])
    expect(result).not.toBe(input)
    expect(input).toEqual(snapshot)
  })
})

describe('toggleTallySort', () => {
  test('starts the other field at ascending', () => {
    expect(toggleTallySort(nameAscending, 'count')).toEqual(countAscending)
  })

  test('reverses the active field', () => {
    expect(toggleTallySort(nameAscending, 'name')).toEqual(nameDescending)
    expect(toggleTallySort(countDescending, 'count')).toEqual(countAscending)
  })
})
