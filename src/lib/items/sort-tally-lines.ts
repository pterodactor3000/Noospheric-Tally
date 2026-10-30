type TallySortField = 'name' | 'count'

type TallySortDirection = 'asc' | 'desc'

interface TallySort {
  readonly field: TallySortField
  readonly direction: TallySortDirection
}

interface SortableTallyLine {
  readonly name: string
  readonly quantity: number
}

const compareNames = (leftName: string, rightName: string): number =>
  leftName.localeCompare(rightName)

const applyDirection = (
  comparison: number,
  direction: TallySortDirection,
): number => (direction === 'asc' ? comparison : -comparison)

const toggleTallySort = (
  current: TallySort,
  field: TallySortField,
): TallySort => {
  if (current.field !== field) {
    return { field, direction: 'asc' }
  }

  return {
    field,
    direction: current.direction === 'asc' ? 'desc' : 'asc',
  }
}

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

    if (sort.field === 'count' && left.quantity !== right.quantity) {
      return applyDirection(left.quantity - right.quantity, sort.direction)
    }

    return applyDirection(compareNames(left.name, right.name), sort.direction)
  })

export { sortTallyLines, toggleTallySort }
export type { TallySort, TallySortField }
