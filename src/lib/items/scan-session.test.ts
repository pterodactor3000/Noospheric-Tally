import { describe, expect, test } from 'vitest'

import {
  SCAN_SESSION_STORAGE_KEY,
  ensureScanSessionId,
  isScanSessionId,
  readScanSessionId,
  type ScanSessionStorage,
} from './scan-session'

const VALID_ID = '0b9c3f2e-5a1d-4c7e-8f46-2d1a9b7e3c50'
const OTHER_VALID_ID = '7D4E1A90-3B2C-4F58-9A6D-8E0C5B1F2A37'

interface MemoryStorage extends ScanSessionStorage {
  readonly writeCount: () => number
}

const createMemoryStorage = (initialValue?: string): MemoryStorage => {
  const values = new Map<string, string>()
  let writes = 0
  if (initialValue !== undefined) {
    values.set(SCAN_SESSION_STORAGE_KEY, initialValue)
  }

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      writes += 1
      values.set(key, value)
    },
    writeCount: () => writes,
  }
}

describe('isScanSessionId', () => {
  test.each([
    ['a lowercase UUID', VALID_ID],
    ['an uppercase UUID', OTHER_VALID_ID],
  ])('accepts %s', (_label, value) => {
    expect(isScanSessionId(value)).toEqual(true)
  })

  test.each([
    ['an empty string', ''],
    ['text that is not a UUID', 'not-a-uuid'],
    ['a UUID with a short last group', '0b9c3f2e-5a1d-4c7e-8f46-2d1a9b7e3c5'],
    ['a UUID with a long last group', '0b9c3f2e-5a1d-4c7e-8f46-2d1a9b7e3c500'],
    ['a UUID with non-hex characters', '0b9c3f2e-5a1d-4c7e-8f46-2d1a9b7e3czz'],
    ['a UUID without dashes', '0b9c3f2e5a1d4c7e8f462d1a9b7e3c50'],
    ['a UUID with a trailing newline', `${VALID_ID}\n`],
    ['null', null],
    ['undefined', undefined],
    ['a number', 42],
    ['an object', { id: VALID_ID }],
  ])('rejects %s', (_label, value) => {
    expect(isScanSessionId(value)).toEqual(false)
  })
})

describe('readScanSessionId', () => {
  test('returns null when the key is missing and does not write', () => {
    const storage = createMemoryStorage()

    expect(readScanSessionId(storage)).toEqual(null)
    expect(storage.writeCount()).toEqual(0)
  })

  test('returns null when the stored value is empty and does not write', () => {
    const storage = createMemoryStorage('')

    expect(readScanSessionId(storage)).toEqual(null)
    expect(storage.writeCount()).toEqual(0)
  })

  test('returns null when the stored value is not a UUID and does not write', () => {
    const storage = createMemoryStorage('not-a-uuid')

    expect(readScanSessionId(storage)).toEqual(null)
    expect(storage.writeCount()).toEqual(0)
  })

  test('returns the stored UUID', () => {
    const storage = createMemoryStorage(VALID_ID)

    expect(readScanSessionId(storage)).toEqual(VALID_ID)
    expect(storage.writeCount()).toEqual(0)
  })
})

describe('ensureScanSessionId', () => {
  test('mints and stores one id when the key is missing', () => {
    const storage = createMemoryStorage()
    let createCount = 0

    const sessionId = ensureScanSessionId(storage, () => {
      createCount += 1
      return VALID_ID
    })

    expect(sessionId).toEqual(VALID_ID)
    expect(createCount).toEqual(1)
    expect(storage.getItem(SCAN_SESSION_STORAGE_KEY)).toEqual(VALID_ID)
    expect(storage.writeCount()).toEqual(1)
  })

  test('mints and stores one id when the stored value is invalid', () => {
    const storage = createMemoryStorage('not-a-uuid')
    let createCount = 0

    const sessionId = ensureScanSessionId(storage, () => {
      createCount += 1
      return VALID_ID
    })

    expect(sessionId).toEqual(VALID_ID)
    expect(createCount).toEqual(1)
    expect(storage.getItem(SCAN_SESSION_STORAGE_KEY)).toEqual(VALID_ID)
  })

  test('returns the stored id and never calls createId when the id is valid', () => {
    const storage = createMemoryStorage(VALID_ID)
    let createCount = 0

    const sessionId = ensureScanSessionId(storage, () => {
      createCount += 1
      return OTHER_VALID_ID
    })

    expect(sessionId).toEqual(VALID_ID)
    expect(createCount).toEqual(0)
    expect(storage.writeCount()).toEqual(0)
  })

  test('reuses the minted id on a second call', () => {
    const storage = createMemoryStorage()
    let createCount = 0
    const createId = () => {
      createCount += 1
      return VALID_ID
    }

    const firstId = ensureScanSessionId(storage, createId)
    const secondId = ensureScanSessionId(storage, createId)

    expect(secondId).toEqual(firstId)
    expect(createCount).toEqual(1)
  })
})
