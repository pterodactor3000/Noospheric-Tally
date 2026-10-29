const SCAN_SESSION_STORAGE_KEY = 'scan-session-id'

type ScanSessionStorage = Pick<Storage, 'getItem' | 'setItem'>

const SCAN_SESSION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const isScanSessionId = (value: unknown): value is string =>
  typeof value === 'string' && SCAN_SESSION_ID_PATTERN.test(value)

const readScanSessionId = (storage: ScanSessionStorage): string | null => {
  const storedId = storage.getItem(SCAN_SESSION_STORAGE_KEY)
  return isScanSessionId(storedId) ? storedId : null
}

const ensureScanSessionId = (
  storage: ScanSessionStorage,
  createId: () => string,
): string => {
  const storedId = readScanSessionId(storage)
  if (storedId !== null) {
    return storedId
  }

  const newId = createId()
  storage.setItem(SCAN_SESSION_STORAGE_KEY, newId)
  return newId
}

export {
  SCAN_SESSION_STORAGE_KEY,
  ensureScanSessionId,
  isScanSessionId,
  readScanSessionId,
}
export type { ScanSessionStorage }
