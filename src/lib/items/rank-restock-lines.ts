import type { HabUnitTallyLine } from './load-hab-unit-items'
import { getStockState } from './stock-state'

interface RestockLine extends HabUnitTallyLine {
  readonly shortfall: number
}

const rankRestockLines = (
  lines: readonly HabUnitTallyLine[],
): RestockLine[] =>
  lines
    .filter(
      (line) =>
        getStockState(line.quantity, line.minimumQuantity) === 'critical',
    )
    .map((line) => ({
      itemId: line.itemId,
      name: line.name,
      quantity: line.quantity,
      minimumQuantity: line.minimumQuantity,
      shortfall: line.minimumQuantity - line.quantity,
    }))
    .sort((left, right) => {
      if (left.shortfall !== right.shortfall) {
        return right.shortfall - left.shortfall
      }

      return left.name.localeCompare(right.name)
    })

export { rankRestockLines }
export type { RestockLine }
