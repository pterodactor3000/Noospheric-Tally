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
}

interface ScanDisplayCreate {
  readonly status: 'create'
}

interface ScanDisplayName {
  readonly status: 'name'
  readonly name: string
}

interface ScanDisplayQuantity {
  readonly status: 'quantity'
  readonly name: string
  readonly quantity: number
}

type ScanDisplay = ScanDisplayCreate | ScanDisplayName | ScanDisplayQuantity

const resolveScanDisplay = (
  direction: ScanDirection,
  stock: ScanStock | null,
): ScanDisplay => {
  if (stock === null) {
    return { status: 'create' }
  }

  if (direction === SCAN_DIRECTION_STOCKING) {
    return { status: 'quantity', name: stock.name, quantity: stock.quantity }
  }

  return { status: 'name', name: stock.name }
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
