const DEFAULT_MINIMUM_QUANTITY = 3
const MINIMUM_QUANTITY_MIN = 0
const MINIMUM_QUANTITY_MAX = 999

type StockState = 'critical' | 'warning' | 'in-stock'

const STOCK_STATE_LABELS: Readonly<Record<StockState, string>> = {
  critical: 'CRITICAL',
  warning: 'WARNING',
  'in-stock': 'IN STOCK',
}

const STOCK_STATE_INITIALS: Readonly<Record<StockState, string>> = {
  critical: 'C',
  warning: 'W',
  'in-stock': 'I',
}

const getStockState = (
  quantity: number,
  minimumQuantity: number,
): StockState => {
  if (quantity <= minimumQuantity) {
    return 'critical'
  }

  if (quantity < 2 * minimumQuantity) {
    return 'warning'
  }

  return 'in-stock'
}

export {
  DEFAULT_MINIMUM_QUANTITY,
  getStockState,
  MINIMUM_QUANTITY_MAX,
  MINIMUM_QUANTITY_MIN,
  STOCK_STATE_INITIALS,
  STOCK_STATE_LABELS,
}
export type { StockState }
