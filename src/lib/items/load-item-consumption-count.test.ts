import { describe, expect, test } from 'vitest'

import { DB_TABLE_HOUSEHOLD_QUANTITY_CHANGES } from '../db/entities'
import {
  loadItemConsumptionCount,
  type ItemConsumptionCountClient,
} from './load-item-consumption-count'

const ITEM_ID = '3c8e1b74-6a2d-4f90-9c15-7e4b2a8d1f06'
const NOW = new Date('2026-10-30T14:00:00.000Z')
const WINDOW_START = '2026-10-23T14:00:00.000Z'
const FAILURE_MESSAGE = `select count from household_quantity_changes failed for item ${ITEM_ID}`

interface CountFilter {
  method: 'eq' | 'is' | 'gte'
  column: string
  value: string | number | null
}

interface RecordedCountQuery {
  table?: string
  columns?: string
  countOptions?: { count: 'exact'; head: true }
  filters: CountFilter[]
}

interface CountQueryResult {
  count: number | null
  error: { message: string } | null
}

interface CountQueryBuilder {
  eq(column: string, value: string | number): CountQueryBuilder
  is(column: string, value: null): CountQueryBuilder
  gte(column: string, value: string): PromiseLike<CountQueryResult>
}

const createCountClientStub = (
  result: CountQueryResult,
  recordedQuery: RecordedCountQuery = { filters: [] },
): ItemConsumptionCountClient => {
  const builder: CountQueryBuilder = {
    eq(column, value) {
      recordedQuery.filters.push({ method: 'eq', column, value })
      return builder
    },
    is(column, value) {
      recordedQuery.filters.push({ method: 'is', column, value })
      return builder
    },
    gte(column, value) {
      recordedQuery.filters.push({ method: 'gte', column, value })
      return Promise.resolve(result)
    },
  }

  const stub = {
    from(table: string) {
      recordedQuery.table = table
      return {
        select(
          columns: string,
          options: { count: 'exact'; head: true },
        ) {
          recordedQuery.columns = columns
          recordedQuery.countOptions = options
          return builder
        },
      }
    },
  }

  // The loader calls only these methods. SupabaseClient has no narrower
  // public type, so the stub crosses `unknown` once, here.
  return stub as unknown as ItemConsumptionCountClient
}

describe('loadItemConsumptionCount', () => {
  test('returns 0 when the count is 0', async () => {
    const client = createCountClientStub({ count: 0, error: null })

    await expect(loadItemConsumptionCount(ITEM_ID, NOW, client)).resolves.toEqual(
      0,
    )
  })

  test('returns 4 when the count is 4', async () => {
    const client = createCountClientStub({ count: 4, error: null })

    await expect(loadItemConsumptionCount(ITEM_ID, NOW, client)).resolves.toEqual(
      4,
    )
  })

  test('queries unreversed using scans from the 7 day window', async () => {
    const recordedQuery: RecordedCountQuery = { filters: [] }
    const client = createCountClientStub(
      { count: 0, error: null },
      recordedQuery,
    )

    await loadItemConsumptionCount(ITEM_ID, NOW, client)

    expect(recordedQuery).toEqual({
      table: DB_TABLE_HOUSEHOLD_QUANTITY_CHANGES,
      columns: 'id',
      countOptions: { count: 'exact', head: true },
      filters: [
        { method: 'eq', column: 'item_id', value: ITEM_ID },
        { method: 'eq', column: 'quantity_delta', value: -1 },
        { method: 'is', column: 'reversed_at', value: null },
        { method: 'gte', column: 'created_at', value: WINDOW_START },
      ],
    })
  })

  test('throws with the item id and the error as cause when the query fails', async () => {
    const queryError = { message: 'permission denied' }
    const client = createCountClientStub({ count: null, error: queryError })

    await expect(loadItemConsumptionCount(ITEM_ID, NOW, client)).rejects.toMatchObject(
      {
        message: FAILURE_MESSAGE,
        cause: queryError,
      },
    )
  })

  test('throws with the item id when the count is null', async () => {
    const client = createCountClientStub({ count: null, error: null })

    await expect(loadItemConsumptionCount(ITEM_ID, NOW, client)).rejects.toThrow(
      FAILURE_MESSAGE,
    )
  })

  test('throws with the item id when now is NaN', async () => {
    const client = createCountClientStub({ count: 0, error: null })

    await expect(
      loadItemConsumptionCount(ITEM_ID, new Date(Number.NaN), client),
    ).rejects.toThrow(
      `loadItemConsumptionCount rejected a time for item ${ITEM_ID}`,
    )
  })
})
