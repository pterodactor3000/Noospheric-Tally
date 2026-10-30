import type { ScanStock } from './scan-direction'
import { getStockState, type StockState } from './stock-state'

interface LookupDisplayFound {
  readonly status: 'found'
  readonly name: string
  readonly quantity: number
  readonly stockState: StockState
}

interface LookupDisplayBlocked {
  readonly status: 'blocked'
}

type LookupDisplay = LookupDisplayFound | LookupDisplayBlocked

const resolveLookupDisplay = (stock: ScanStock | null): LookupDisplay => {
  if (stock === null) {
    return { status: 'blocked' }
  }

  return {
    status: 'found',
    name: stock.name,
    quantity: stock.quantity,
    stockState: getStockState(stock.quantity, stock.minimumQuantity),
  }
}

export { resolveLookupDisplay }
export type { LookupDisplay }
