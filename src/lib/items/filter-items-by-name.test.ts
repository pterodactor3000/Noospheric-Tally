import { describe, expect, test } from 'vitest'

import { filterItemsByName } from './filter-items-by-name'

interface NamedItem {
  readonly name: string
}

const items: readonly NamedItem[] = [
  { name: 'Black pepper' },
  { name: 'Cinnamon' },
  { name: 'Sea salt' },
]

describe('filterItemsByName', () => {
  test('returns every item in a new array when the query is empty', () => {
    const result = filterItemsByName(items, '')

    expect(result).toEqual([...items])
    expect(result).not.toBe(items)
  })

  test('returns every item when the query is whitespace only', () => {
    const result = filterItemsByName(items, '   ')

    expect(result).toEqual([...items])
    expect(result).not.toBe(items)
  })

  test('matches a name that differs only in case', () => {
    expect(filterItemsByName(items, 'CINNAMON')).toEqual([{ name: 'Cinnamon' }])
  })

  test('matches a query in the middle of a name', () => {
    expect(filterItemsByName(items, 'pep')).toEqual([{ name: 'Black pepper' }])
  })

  test('matches a query with surrounding spaces', () => {
    expect(filterItemsByName(items, '  salt  ')).toEqual([{ name: 'Sea salt' }])
  })

  test('returns an empty array when nothing matches', () => {
    expect(filterItemsByName(items, 'nutmeg')).toEqual([])
  })

  test('keeps input order', () => {
    const unordered: readonly NamedItem[] = [
      { name: 'Salt' },
      { name: 'Pepper' },
      { name: 'Paprika' },
    ]

    expect(filterItemsByName(unordered, 'p')).toEqual([
      { name: 'Pepper' },
      { name: 'Paprika' },
    ])
  })

  test('returns an empty array when the item list is empty', () => {
    expect(filterItemsByName([], 'salt')).toEqual([])
  })

  test('leaves the input array unchanged', () => {
    const input: NamedItem[] = [
      { name: 'Salt' },
      { name: 'Pepper' },
    ]
    const snapshot = [...input]
    Object.freeze(input)

    const result = filterItemsByName(input, 'pep')

    expect(result).toEqual([{ name: 'Pepper' }])
    expect(result).not.toBe(input)
    expect(input).toEqual(snapshot)
  })
})
