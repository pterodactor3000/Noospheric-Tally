import { getStockState, type StockState } from './stock-state'

const SCAN_DIRECTION_USING = 'using'
const SCAN_DIRECTION_STOCKING = 'stocking'
const SCAN_DIRECTION_STORAGE_KEY = 'scan-direction'

type ScanDirection =
  | typeof SCAN_DIRECTION_USING
  | typeof SCAN_DIRECTION_STOCKING

type ScanDirectionStorage = Pick<Storage, 'getItem' | 'setItem'>

const readScanDirection = (storage: ScanDirectionStorage): ScanDirection =>
  storage.getItem(SCAN_DIRECTION_STORAGE_KEY) === SCAN_DIRECTION_STOCKING
    ? SCAN_DIRECTION_STOCKING
    : SCAN_DIRECTION_USING

const writeScanDirection = (
  storage: ScanDirectionStorage,
  direction: ScanDirection,
): void => {
  storage.setItem(SCAN_DIRECTION_STORAGE_KEY, direction)
}

interface ScanStock {
  readonly name: string
  readonly quantity: number
  readonly minimumQuantity: number
}

interface ScanDisplayCreate {
  readonly status: 'create'
}

interface ScanDisplayQuantity {
  readonly status: 'quantity'
  readonly name: string
  readonly quantity: number
  readonly stockState: StockState
}

type ScanDisplay = ScanDisplayCreate | ScanDisplayQuantity

const resolveScanDisplay = (
  direction: ScanDirection,
  stock: ScanStock | null,
): ScanDisplay => {
  if (stock === null) {
    return { status: 'create' }
  }

  return {
    status: 'quantity',
    name: stock.name,
    quantity: stock.quantity,
    stockState: getStockState(stock.quantity, stock.minimumQuantity),
  }
}

export {
  SCAN_DIRECTION_STOCKING,
  SCAN_DIRECTION_STORAGE_KEY,
  SCAN_DIRECTION_USING,
  readScanDirection,
  resolveScanDisplay,
  writeScanDirection,
}
export type { ScanDirection, ScanDirectionStorage, ScanDisplay, ScanStock }
