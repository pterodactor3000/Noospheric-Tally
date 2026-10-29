import { describe, expect, test } from 'vitest'

import { DB_TABLE_HOUSEHOLD_QUANTITY_CHANGES } from '../db/entities'
import {
  loadScanSessionLines,
  type ScanSessionLinesClient,
} from './load-scan-session-lines'

const SCAN_SESSION_ID = '0b9c3f2e-5a1d-4c7e-8f46-2d1a9b7e3c50'
const FIRST_CHANGE_ID = '7d4e1a90-3b2c-4f58-9a6d-8e0c5b1f2a37'
const SECOND_CHANGE_ID = '1f6a2c84-9d3e-4b07-a5c1-3e8d7f0b4a92'
const FIRST_BARCODE = '3017620422003'
const SECOND_BARCODE = '5449000000996'

interface RecordedQuery {
  table?: string
  columns?: string
  filter?: { column: string; value: string }
  order?: { column: string; options: { ascending: boolean } }
}

interface LinesQueryResult {
  data: unknown
  error: { message: string } | null
}

interface LinesClientStub {
  from(table: string): {
    select(columns: string): {
      eq(
        column: string,
        value: string,
      ): {
        order(
          column: string,
          options: { ascending: boolean },
        ): PromiseLike<LinesQueryResult>
      }
    }
  }
}

const createLinesClientStub = (
  result: LinesQueryResult,
  recordedQuery: RecordedQuery = {},
): ScanSessionLinesClient => {
  const stub: LinesClientStub = {
    from(table) {
      recordedQuery.table = table
      return {
        select(columns) {
          recordedQuery.columns = columns
          return {
            eq(column, value) {
              recordedQuery.filter = { column, value }
              return {
                order(orderColumn, options) {
                  recordedQuery.order = { column: orderColumn, options }
                  return Promise.resolve(result)
                },
              }
            },
          }
        },
      }
    },
  }

  // The loader calls only these four methods. SupabaseClient has no narrower
  // public type, so the stub crosses `unknown` once, here.
  return stub as unknown as ScanSessionLinesClient
}

const createRow = (overrides: Record<string, unknown> = {}) => ({
  id: FIRST_CHANGE_ID,
  barcode: FIRST_BARCODE,
  quantity_delta: 1,
  created_at: '2026-10-29T18:00:00.000Z',
  reversed_at: null,
  household_inventory: { name: 'Plasma coil' },
  ...overrides,
})

describe('loadScanSessionLines', () => {
  test('returns an empty array when the session has no rows', async () => {
    const client = createLinesClientStub({ data: [], error: null })

    await expect(loadScanSessionLines(SCAN_SESSION_ID, client)).resolves.toEqual(
      [],
    )
  })

  test('queries the change table for the session ordered newest first', async () => {
    const recordedQuery: RecordedQuery = {}
    const client = createLinesClientStub(
      { data: [], error: null },
      recordedQuery,
    )

    await loadScanSessionLines(SCAN_SESSION_ID, client)

    expect(recordedQuery).toEqual({
      table: DB_TABLE_HOUSEHOLD_QUANTITY_CHANGES,
      columns:
        'id, barcode, quantity_delta, created_at, reversed_at, household_inventory(name)',
      filter: { column: 'scan_session_id', value: SCAN_SESSION_ID },
      order: { column: 'created_at', options: { ascending: false } },
    })
  })

  test('maps rows in the order the query returned them', async () => {
    const client = createLinesClientStub({
      data: [
        createRow({
          id: SECOND_CHANGE_ID,
          barcode: SECOND_BARCODE,
          quantity_delta: -1,
          created_at: '2026-10-29T18:05:00.000Z',
          household_inventory: { name: 'Cola' },
        }),
        createRow(),
      ],
      error: null,
    })

    await expect(loadScanSessionLines(SCAN_SESSION_ID, client)).resolves.toEqual(
      [
        {
          changeId: SECOND_CHANGE_ID,
          name: 'Cola',
          barcode: SECOND_BARCODE,
          quantityDelta: -1,
          isReversed: false,
          createdAt: '2026-10-29T18:05:00.000Z',
        },
        {
          changeId: FIRST_CHANGE_ID,
          name: 'Plasma coil',
          barcode: FIRST_BARCODE,
          quantityDelta: 1,
          isReversed: false,
          createdAt: '2026-10-29T18:00:00.000Z',
        },
      ],
    )
  })

  test('marks a row with reversed_at set as reversed', async () => {
    const client = createLinesClientStub({
      data: [createRow({ reversed_at: '2026-10-29T18:10:00.000Z' })],
      error: null,
    })

    const lines = await loadScanSessionLines(SCAN_SESSION_ID, client)

    expect(lines.map((line) => line.isReversed)).toEqual([true])
  })

  test('maps a -1 row to a quantityDelta of -1', async () => {
    const client = createLinesClientStub({
      data: [createRow({ quantity_delta: -1 })],
      error: null,
    })

    const lines = await loadScanSessionLines(SCAN_SESSION_ID, client)

    expect(lines.map((line) => line.quantityDelta)).toEqual([-1])
  })

  test('throws with the session id and the error as cause when the query fails', async () => {
    const queryError = { message: 'permission denied' }
    const client = createLinesClientStub({ data: null, error: queryError })

    await expect(
      loadScanSessionLines(SCAN_SESSION_ID, client),
    ).rejects.toMatchObject({
      message: `select from household_quantity_changes failed for scan session ${SCAN_SESSION_ID}`,
      cause: queryError,
    })
  })

  test.each([
    ['null data', null],
    ['a non-array data', { id: FIRST_CHANGE_ID }],
    ['a non-object row', ['row']],
    ['a row with a missing name', [createRow({ household_inventory: {} })]],
    ['a row with a null inventory embed', [createRow({ household_inventory: null })]],
    ['a row with a delta of 2', [createRow({ quantity_delta: 2 })]],
    ['a row with a delta of 0', [createRow({ quantity_delta: 0 })]],
    ['a row with a string delta', [createRow({ quantity_delta: '1' })]],
    ['a row with a numeric id', [createRow({ id: 7 })]],
    ['a row with a missing barcode', [createRow({ barcode: undefined })]],
    ['a row with a numeric reversed_at', [createRow({ reversed_at: 5 })]],
    ['a row with a missing created_at', [createRow({ created_at: undefined })]],
  ])('throws with the session id when the query returns %s', async (_label, data) => {
    const client = createLinesClientStub({ data, error: null })

    await expect(loadScanSessionLines(SCAN_SESSION_ID, client)).rejects.toThrow(
      `select from household_quantity_changes failed for scan session ${SCAN_SESSION_ID}`,
    )
  })
})
