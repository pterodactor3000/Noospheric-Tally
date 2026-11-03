import { describe, expect, test } from 'vitest'

import { DB_FUNCTION_DELETE_HOUSEHOLD_CATEGORY } from '../db/entities'
import {
  deleteHabUnitCategory,
  type DeleteHouseholdCategoryClient,
} from './delete-hab-unit-category'

const CATEGORY_ID = '7d4e1a90-3b2c-4f58-9a6d-8e0c5b1f2a37'

const createDeleteClientStub = (
  result: PromiseLike<{
    data: unknown
    error: { message: string; code?: string } | null
  }>,
): DeleteHouseholdCategoryClient => ({
  rpc(functionName, args) {
    expect(functionName).toEqual(DB_FUNCTION_DELETE_HOUSEHOLD_CATEGORY)
    expect(args).toEqual({
      target_category_id: CATEGORY_ID,
    })
    return result
  },
})

describe('deleteHabUnitCategory', () => {
  test('returns deleted when the rpc succeeds', async () => {
    const client = createDeleteClientStub(
      Promise.resolve({ data: null, error: null }),
    )

    await expect(deleteHabUnitCategory(CATEGORY_ID, client)).resolves.toEqual({
      status: 'deleted',
    })
  })

  test('returns missing when the rpc error code is P0002', async () => {
    const client = createDeleteClientStub(
      Promise.resolve({
        data: null,
        error: {
          message: 'delete_household_category found no category',
          code: 'P0002',
        },
      }),
    )

    await expect(deleteHabUnitCategory(CATEGORY_ID, client)).resolves.toEqual({
      status: 'missing',
    })
  })

  test('throws an error that names the category and keeps the rpc error as cause', async () => {
    const rpcError = { message: 'permission denied', code: '42501' }
    const client = createDeleteClientStub(
      Promise.resolve({ data: null, error: rpcError }),
    )

    await expect(deleteHabUnitCategory(CATEGORY_ID, client)).rejects.toMatchObject({
      message: `delete_household_category failed for category ${CATEGORY_ID}`,
      cause: rpcError,
    })
  })
})
