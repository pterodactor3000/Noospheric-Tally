import type { StockState } from '@/lib/items/stock-state'

const STOCK_STATE_CLASS_NAMES: Readonly<Record<StockState, string>> = {
  critical: 'bg-stock-critical text-stock-critical-foreground',
  warning: 'bg-stock-warning text-stock-warning-foreground',
  'in-stock': 'bg-stock-in-stock text-stock-in-stock-foreground',
}

export { STOCK_STATE_CLASS_NAMES }
