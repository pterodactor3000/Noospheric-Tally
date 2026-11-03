import { describe, expect, test } from 'vitest'

import { groupTallyLinesByCategory } from './group-tally-lines-by-category'
import {
  ITEM_CATEGORIES,
  ITEM_CATEGORY_LABELS,
  type ItemCategory,
} from './item-category'
import { getCategoryRefKey, type ItemCategoryRef } from './item-category-ref'
import type { HabUnitCategory } from './load-hab-unit-categories'

interface SampleLine {
  readonly category: ItemCategoryRef
  readonly name: string
}

const builtIn = (category: ItemCategory): ItemCategoryRef => ({
  kind: 'built-in',
  category,
})

const builtInGroup = (
  category: ItemCategory,
  lines: readonly SampleLine[] = [],
) => ({
  key: getCategoryRefKey(builtIn(category)),
  ref: builtIn(category),
  label: ITEM_CATEGORY_LABELS[category],
  lines,
})

const customCategory = (
  id: string,
  name: string,
  createdAt: string,
): HabUnitCategory => ({
  id,
  name,
  createdAt,
})

const customGroup = (
  category: HabUnitCategory,
  lines: readonly SampleLine[] = [],
) => ({
  key: getCategoryRefKey({ kind: 'custom', categoryId: category.id }),
  ref: { kind: 'custom' as const, categoryId: category.id },
  label: category.name,
  lines,
})

const emptyBuiltInGroups = ITEM_CATEGORIES.map((category) =>
  builtInGroup(category),
)

const CLEANING_ID = '11111111-1111-4111-8111-111111111111'
const GARDEN_ID = '22222222-2222-4222-8222-222222222222'
const UNKNOWN_ID = '33333333-3333-4333-8333-333333333333'

describe('groupTallyLinesByCategory', () => {
  test('returns five empty groups for no lines', () => {
    expect(groupTallyLinesByCategory([], [])).toEqual(emptyBuiltInGroups)
  })

  test('returns built-in groups in panel order', () => {
    const lines: readonly SampleLine[] = [
      { category: builtIn('uncategorized'), name: 'Tape' },
      { category: builtIn('other'), name: 'Battery' },
      { category: builtIn('beauty'), name: 'Soap' },
      { category: builtIn('food'), name: 'Rice' },
      { category: builtIn('pet-food'), name: 'Kibble' },
    ]

    expect(
      groupTallyLinesByCategory(lines, []).map((group) => group.key),
    ).toEqual(['pet-food', 'food', 'beauty', 'other', 'uncategorized'])
  })

  test('puts each line in its own category', () => {
    const kibble = { category: builtIn('pet-food'), name: 'Kibble' } as const
    const rice = { category: builtIn('food'), name: 'Rice' } as const
    const soap = { category: builtIn('beauty'), name: 'Soap' } as const
    const battery = { category: builtIn('other'), name: 'Battery' } as const
    const tape = {
      category: builtIn('uncategorized'),
      name: 'Tape',
    } as const

    expect(
      groupTallyLinesByCategory([tape, battery, soap, rice, kibble], []),
    ).toEqual([
      builtInGroup('pet-food', [kibble]),
      builtInGroup('food', [rice]),
      builtInGroup('beauty', [soap]),
      builtInGroup('other', [battery]),
      builtInGroup('uncategorized', [tape]),
    ])
  })

  test('keeps input order inside a group', () => {
    const rice = { category: builtIn('food'), name: 'Rice' } as const
    const kibble = { category: builtIn('pet-food'), name: 'Kibble' } as const
    const beans = { category: builtIn('food'), name: 'Beans' } as const

    expect(groupTallyLinesByCategory([rice, kibble, beans], [])).toEqual([
      builtInGroup('pet-food', [kibble]),
      builtInGroup('food', [rice, beans]),
      builtInGroup('beauty'),
      builtInGroup('other'),
      builtInGroup('uncategorized'),
    ])
  })

  test('returns custom groups first, earliest created first', () => {
    const garden = customCategory(GARDEN_ID, 'Garden', '2026-11-03T12:00:00.000Z')
    const cleaning = customCategory(
      CLEANING_ID,
      'Cleaning',
      '2026-11-03T11:00:00.000Z',
    )
    const broom = {
      category: { kind: 'custom' as const, categoryId: CLEANING_ID },
      name: 'Broom',
    }

    expect(
      groupTallyLinesByCategory([broom], [garden, cleaning]),
    ).toEqual([
      customGroup(cleaning, [broom]),
      customGroup(garden),
      ...emptyBuiltInGroups,
    ])
    expect(customGroup(cleaning).key).toEqual(`custom-${CLEANING_ID}`)
  })

  test('breaks equal creation times by id ascending', () => {
    const garden = customCategory(GARDEN_ID, 'Garden', '2026-11-03T11:00:00.000Z')
    const cleaning = customCategory(
      CLEANING_ID,
      'Cleaning',
      '2026-11-03T11:00:00.000Z',
    )

    expect(
      groupTallyLinesByCategory([], [garden, cleaning]).map((group) => group.key),
    ).toEqual([
      `custom-${CLEANING_ID}`,
      `custom-${GARDEN_ID}`,
      'pet-food',
      'food',
      'beauty',
      'other',
      'uncategorized',
    ])
  })

  test('includes an empty custom group', () => {
    const cleaning = customCategory(
      CLEANING_ID,
      'Cleaning',
      '2026-11-03T11:00:00.000Z',
    )

    expect(groupTallyLinesByCategory([], [cleaning])[0]).toEqual(
      customGroup(cleaning),
    )
  })

  test('places a line with an unknown custom id in Uncategorized', () => {
    const broom = {
      category: { kind: 'custom' as const, categoryId: UNKNOWN_ID },
      name: 'Broom',
    }

    expect(groupTallyLinesByCategory([broom], [])).toEqual([
      builtInGroup('pet-food'),
      builtInGroup('food'),
      builtInGroup('beauty'),
      builtInGroup('other'),
      builtInGroup('uncategorized', [broom]),
    ])
  })

  test('does not mutate the input', () => {
    const input: SampleLine[] = [
      { category: builtIn('beauty'), name: 'Soap' },
      { category: builtIn('food'), name: 'Rice' },
    ]
    const snapshot: SampleLine[] = [
      { category: builtIn('beauty'), name: 'Soap' },
      { category: builtIn('food'), name: 'Rice' },
    ]
    const garden = customCategory(GARDEN_ID, 'Garden', '2026-11-03T12:00:00.000Z')
    const cleaning = customCategory(
      CLEANING_ID,
      'Cleaning',
      '2026-11-03T11:00:00.000Z',
    )
    const categories = [garden, cleaning]
    const categorySnapshot = [garden, cleaning]

    groupTallyLinesByCategory(input, categories)

    expect(input).toEqual(snapshot)
    expect(categories).toEqual(categorySnapshot)
  })
})
