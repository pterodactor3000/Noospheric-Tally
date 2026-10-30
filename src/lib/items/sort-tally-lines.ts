type TallySort = 'name' | 'count'

interface SortableTallyLine {
  readonly name: string
  readonly quantity: number
}

const compareNames = (leftName: string, rightName: string): number =>
  leftName.localeCompare(rightName)

const sortTallyLines = <TLine extends SortableTallyLine>(
  lines: readonly TLine[],
  sort: TallySort,
): TLine[] =>
  [...lines].sort((left, right) => {
    const isLeftAtZero = left.quantity === 0
    const isRightAtZero = right.quantity === 0
    if (isLeftAtZero !== isRightAtZero) {
      return isLeftAtZero ? 1 : -1
    }

    if (sort === 'count' && left.quantity !== right.quantity) {
      return left.quantity - right.quantity
    }

    return compareNames(left.name, right.name)
  })

export { sortTallyLines }
export type { TallySort }
