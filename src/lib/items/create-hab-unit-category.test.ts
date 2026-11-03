import { describe, expect, test } from 'vitest'

import { DB_FUNCTION_CREATE_HOUSEHOLD_CATEGORY } from '../db/entities'
import {
  createHabUnitCategory,
  type CreateHouseholdCategoryClient,
} from './create-hab-unit-category'

const CATEGORY_NAME = 'Cleaning'
const CATEGORY_ID = '7d4e1a90-3b2c-4f58-9a6d-8e0c5b1f2a37'

const createCategoryClientStub = (
  result: PromiseLike<{
    data: unknown
    error: { message: string; code?: string } | null
  }>,
): CreateHouseholdCategoryClient => ({
  rpc(functionName, args) {
    expect(functionName).toEqual(DB_FUNCTION_CREATE_HOUSEHOLD_CATEGORY)
    expect(args).toEqual({ category_name: CATEGORY_NAME })
    return result
  },
})

describe('createHabUnitCategory', () => {
  test('returns the category id when the rpc creates a category', async () => {
    const client = createCategoryClientStub(
      Promise.resolve({ data: CATEGORY_ID, error: null }),
    )

    await expect(createHabUnitCategory(CATEGORY_NAME, client)).resolves.toEqual(
      { status: 'created', categoryId: CATEGORY_ID },
    )
  })

  test('returns duplicate when the rpc error code is 23505', async () => {
    const client = createCategoryClientStub(
      Promise.resolve({
        data: null,
        error: {
          message: 'duplicate key value violates unique constraint',
          code: '23505',
        },
      }),
    )

    await expect(createHabUnitCategory(CATEGORY_NAME, client)).resolves.toEqual(
      { status: 'duplicate' },
    )
  })

  test('throws an error that names the category and keeps the rpc error as cause', async () => {
    const rpcError = { message: 'permission denied', code: '42501' }
    const client = createCategoryClientStub(
      Promise.resolve({ data: null, error: rpcError }),
    )

    await expect(
      createHabUnitCategory(CATEGORY_NAME, client),
    ).rejects.toMatchObject({
      message: `create_household_category failed for name ${CATEGORY_NAME}`,
      cause: rpcError,
    })
  })

  test('throws when the rpc returns a non-string result', async () => {
    const client = createCategoryClientStub(
      Promise.resolve({ data: null, error: null }),
    )

    await expect(createHabUnitCategory(CATEGORY_NAME, client)).rejects.toThrow(
      `create_household_category failed for name ${CATEGORY_NAME}`,
    )
  })
})
