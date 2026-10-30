import { getStockState } from './stock-state'

const getCategoryShortage = (
  lines: readonly {
    readonly quantity: number
    readonly minimumQuantity: number
  }[],
): 'critical' | 'warning' | null => {
  let shortage: 'critical' | 'warning' | null = null

  for (const line of lines) {
    const stockState = getStockState(line.quantity, line.minimumQuantity)

    if (stockState === 'critical') {
      return 'critical'
    }

    if (stockState === 'warning') {
      shortage = 'warning'
    }
  }

  return shortage
}

export { getCategoryShortage }
