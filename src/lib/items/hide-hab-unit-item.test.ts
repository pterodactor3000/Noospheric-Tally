import { describe, expect, test } from 'vitest'

import { DB_FUNCTION_HIDE_HOUSEHOLD_ITEM } from '../db/entities'
import {
  hideHabUnitItem,
  type HideHouseholdItemClient,
} from './hide-hab-unit-item'

const ITEM_ID = '7d4e1a90-3b2c-4f58-9a6d-8e0c5b1f2a37'

const createHideClientStub = (
  result: PromiseLike<{
    data: unknown
    error: { message: string } | null
  }>,
): HideHouseholdItemClient => ({
  rpc(functionName, args) {
    expect(functionName).toEqual(DB_FUNCTION_HIDE_HOUSEHOLD_ITEM)
    expect(args).toEqual({ target_item_id: ITEM_ID })
    return result
  },
})

describe('hideHabUnitItem', () => {
  test('resolves with undefined when the rpc returns no error', async () => {
    const client = createHideClientStub(
      Promise.resolve({ data: null, error: null }),
    )

    await expect(hideHabUnitItem(ITEM_ID, client)).resolves.toEqual(undefined)
  })

  test('throws an error with message hide_household_item failed for item and the rpc error as cause when the rpc returns an error', async () => {
    const rpcError = { message: 'permission denied' }
    const client = createHideClientStub(
      Promise.resolve({ data: null, error: rpcError }),
    )

    await expect(hideHabUnitItem(ITEM_ID, client)).rejects.toMatchObject({
      message: `hide_household_item failed for item ${ITEM_ID}`,
      cause: rpcError,
    })
  })

  test('sends the item id it was given as target_item_id', async () => {
    let callCount = 0
    const client: HideHouseholdItemClient = {
      rpc(functionName, args) {
        callCount += 1
        expect(functionName).toEqual(DB_FUNCTION_HIDE_HOUSEHOLD_ITEM)
        expect(args).toEqual({ target_item_id: ITEM_ID })
        return Promise.resolve({ data: null, error: null })
      },
    }

    await hideHabUnitItem(ITEM_ID, client)

    expect(callCount).toEqual(1)
  })
})
