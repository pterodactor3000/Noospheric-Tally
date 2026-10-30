import { describe, expect, test } from 'vitest'

import type { ItemCategory } from './item-category'
import { groupTallyLinesByCategory } from './group-tally-lines-by-category'

interface SampleLine {
  readonly category: ItemCategory
  readonly name: string
}

const emptyGroups = [
  { category: 'pet-food', lines: [] },
  { category: 'food', lines: [] },
  { category: 'beauty', lines: [] },
  { category: 'other', lines: [] },
  { category: 'uncategorized', lines: [] },
] as const

describe('groupTallyLinesByCategory', () => {
  test('returns five empty groups for no lines', () => {
    expect(groupTallyLinesByCategory([])).toEqual(emptyGroups)
  })

  test('returns groups in panel order', () => {
    const lines: readonly SampleLine[] = [
      { category: 'uncategorized', name: 'Tape' },
      { category: 'other', name: 'Battery' },
      { category: 'beauty', name: 'Soap' },
      { category: 'food', name: 'Rice' },
      { category: 'pet-food', name: 'Kibble' },
    ]

    expect(
      groupTallyLinesByCategory(lines).map((group) => group.category),
    ).toEqual(['pet-food', 'food', 'beauty', 'other', 'uncategorized'])
  })

  test('puts each line in its own category', () => {
    const kibble = { category: 'pet-food', name: 'Kibble' } as const
    const rice = { category: 'food', name: 'Rice' } as const
    const soap = { category: 'beauty', name: 'Soap' } as const
    const battery = { category: 'other', name: 'Battery' } as const
    const tape = { category: 'uncategorized', name: 'Tape' } as const

    expect(
      groupTallyLinesByCategory([tape, battery, soap, rice, kibble]),
    ).toEqual([
      { category: 'pet-food', lines: [kibble] },
      { category: 'food', lines: [rice] },
      { category: 'beauty', lines: [soap] },
      { category: 'other', lines: [battery] },
      { category: 'uncategorized', lines: [tape] },
    ])
  })

  test('keeps input order inside a group', () => {
    const rice = { category: 'food', name: 'Rice' } as const
    const kibble = { category: 'pet-food', name: 'Kibble' } as const
    const beans = { category: 'food', name: 'Beans' } as const

    expect(groupTallyLinesByCategory([rice, kibble, beans])).toEqual([
      { category: 'pet-food', lines: [kibble] },
      { category: 'food', lines: [rice, beans] },
      { category: 'beauty', lines: [] },
      { category: 'other', lines: [] },
      { category: 'uncategorized', lines: [] },
    ])
  })

  test('does not mutate the input', () => {
    const input: SampleLine[] = [
      { category: 'beauty', name: 'Soap' },
      { category: 'food', name: 'Rice' },
    ]
    const snapshot: SampleLine[] = [
      { category: 'beauty', name: 'Soap' },
      { category: 'food', name: 'Rice' },
    ]

    groupTallyLinesByCategory(input)

    expect(input).toEqual(snapshot)
  })
})
