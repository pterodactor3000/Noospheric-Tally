import { describe, expect, test } from 'vitest'

import { rankRestockLines } from './rank-restock-lines'
import type { HabUnitTallyLine } from './load-hab-unit-items'

interface RestockLineInput {
  readonly name: string
  readonly quantity: number
  readonly minimumQuantity: number
}

let nextItemNumber = 0

const line = ({
  name,
  quantity,
  minimumQuantity,
}: RestockLineInput): HabUnitTallyLine => {
  nextItemNumber += 1
  return {
    itemId: `item-${nextItemNumber}`,
    name,
    quantity,
    minimumQuantity,
  }
}

describe('rankRestockLines', () => {
  test('returns an empty array when there are no lines', () => {
    expect(rankRestockLines([])).toEqual([])
  })

  test('returns an empty array when every line is above its minimum', () => {
    expect(
      rankRestockLines([
        line({ name: 'Pepper', quantity: 4, minimumQuantity: 3 }),
        line({ name: 'Salt', quantity: 9, minimumQuantity: 3 }),
      ]),
    ).toEqual([])
  })

  test('includes a line at its minimum with a shortfall of 0', () => {
    const atMinimum = line({ name: 'Salt', quantity: 3, minimumQuantity: 3 })

    expect(rankRestockLines([atMinimum])).toEqual([
      {
        itemId: atMinimum.itemId,
        name: 'Salt',
        quantity: 3,
        minimumQuantity: 3,
        shortfall: 0,
      },
    ])
  })

  test('leaves out a WARNING line and an IN STOCK line', () => {
    const critical = line({ name: 'Basil', quantity: 1, minimumQuantity: 3 })

    expect(
      rankRestockLines([
        line({ name: 'Pepper', quantity: 4, minimumQuantity: 3 }),
        critical,
        line({ name: 'Salt', quantity: 6, minimumQuantity: 3 }),
      ]),
    ).toEqual([
      {
        itemId: critical.itemId,
        name: 'Basil',
        quantity: 1,
        minimumQuantity: 3,
        shortfall: 2,
      },
    ])
  })

  test('includes a line with minimum 0 and quantity 0 with a shortfall of 0', () => {
    const empty = line({ name: 'Ash', quantity: 0, minimumQuantity: 0 })

    expect(rankRestockLines([empty])).toEqual([
      {
        itemId: empty.itemId,
        name: 'Ash',
        quantity: 0,
        minimumQuantity: 0,
        shortfall: 0,
      },
    ])
  })

  test('ranks a count of 0 with the largest shortfall first', () => {
    const noneLeft = line({ name: 'Spice', quantity: 0, minimumQuantity: 5 })
    const someLeft = line({ name: 'Food', quantity: 2, minimumQuantity: 3 })

    expect(rankRestockLines([someLeft, noneLeft]).map((row) => row.name)).toEqual([
      'Spice',
      'Food',
    ])
  })

  test('ranks a larger shortfall above a smaller one regardless of count', () => {
    const highCount = line({ name: 'Tins', quantity: 4, minimumQuantity: 9 })
    const zeroCount = line({ name: 'Salt', quantity: 0, minimumQuantity: 1 })

    expect(rankRestockLines([zeroCount, highCount]).map((row) => row.shortfall)).toEqual([
      5,
      1,
    ])
  })

  test('sorts equal shortfalls by name A to Z', () => {
    const salt = line({ name: 'Salt', quantity: 1, minimumQuantity: 3 })
    const pepper = line({ name: 'Pepper', quantity: 1, minimumQuantity: 3 })

    expect(rankRestockLines([salt, pepper]).map((row) => row.name)).toEqual([
      'Pepper',
      'Salt',
    ])
  })

  test('computes shortfall as minimum minus quantity', () => {
    const spice = line({ name: 'Spice', quantity: 2, minimumQuantity: 5 })

    expect(rankRestockLines([spice])[0]?.shortfall).toEqual(3)
  })

  test('does not change the input array', () => {
    const first = line({ name: 'Spice', quantity: 0, minimumQuantity: 5 })
    const second = line({ name: 'Salt', quantity: 4, minimumQuantity: 3 })
    const input = [second, first]

    rankRestockLines(input)

    expect(input).toEqual([second, first])
    expect(input[0]).toBe(second)
    expect(input[1]).toBe(first)
  })
})
