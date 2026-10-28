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

export {
  SCAN_DIRECTION_STOCKING,
  SCAN_DIRECTION_STORAGE_KEY,
  SCAN_DIRECTION_USING,
  readScanDirection,
  writeScanDirection,
}
export type { ScanDirection, ScanDirectionStorage }
