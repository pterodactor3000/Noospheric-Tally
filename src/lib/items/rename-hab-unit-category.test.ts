import { describe, expect, test } from 'vitest'

import { DB_FUNCTION_RENAME_HOUSEHOLD_CATEGORY } from '../db/entities'
import {
  renameHabUnitCategory,
  type RenameHouseholdCategoryClient,
} from './rename-hab-unit-category'

const CATEGORY_NAME = 'Cleaners'
const CATEGORY_ID = '7d4e1a90-3b2c-4f58-9a6d-8e0c5b1f2a37'

const createRenameClientStub = (
  result: PromiseLike<{
    data: unknown
    error: { message: string; code?: string } | null
  }>,
): RenameHouseholdCategoryClient => ({
  rpc(functionName, args) {
    expect(functionName).toEqual(DB_FUNCTION_RENAME_HOUSEHOLD_CATEGORY)
    expect(args).toEqual({
      target_category_id: CATEGORY_ID,
      new_name: CATEGORY_NAME,
    })
    return result
  },
})

describe('renameHabUnitCategory', () => {
  test('returns renamed when the rpc succeeds', async () => {
    const client = createRenameClientStub(
      Promise.resolve({ data: null, error: null }),
    )

    await expect(
      renameHabUnitCategory(
        { categoryId: CATEGORY_ID, name: CATEGORY_NAME },
        client,
      ),
    ).resolves.toEqual({ status: 'renamed' })
  })

  test('returns duplicate when the rpc error code is 23505', async () => {
    const client = createRenameClientStub(
      Promise.resolve({
        data: null,
        error: {
          message: 'duplicate key value violates unique constraint',
          code: '23505',
        },
      }),
    )

    await expect(
      renameHabUnitCategory(
        { categoryId: CATEGORY_ID, name: CATEGORY_NAME },
        client,
      ),
    ).resolves.toEqual({ status: 'duplicate' })
  })

  test('returns missing when the rpc error code is P0002', async () => {
    const client = createRenameClientStub(
      Promise.resolve({
        data: null,
        error: {
          message: 'rename_household_category found no category',
          code: 'P0002',
        },
      }),
    )

    await expect(
      renameHabUnitCategory(
        { categoryId: CATEGORY_ID, name: CATEGORY_NAME },
        client,
      ),
    ).resolves.toEqual({ status: 'missing' })
  })

  test('throws an error that names the category and the name and keeps the rpc error as cause', async () => {
    const rpcError = { message: 'permission denied', code: '42501' }
    const client = createRenameClientStub(
      Promise.resolve({ data: null, error: rpcError }),
    )

    await expect(
      renameHabUnitCategory(
        { categoryId: CATEGORY_ID, name: CATEGORY_NAME },
        client,
      ),
    ).rejects.toMatchObject({
      message: `rename_household_category failed for category ${CATEGORY_ID} and name ${CATEGORY_NAME}`,
      cause: rpcError,
    })
  })
})
