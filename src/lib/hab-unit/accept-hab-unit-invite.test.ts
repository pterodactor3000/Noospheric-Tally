import { describe, expect, test } from 'vitest'

import { DB_FUNCTION_ACCEPT_HOUSEHOLD_INVITE } from '../db/entities'
import {
  acceptHabUnitInvite,
  type AcceptHabUnitInviteClient,
} from './accept-hab-unit-invite'

const INVITE_CODE = '0123456789abcdef0123456789abcdef'
const HAB_UNIT_ID = '7d4e1a90-3b2c-4f58-9a6d-8e0c5b1f2a37'

const createAcceptClientStub = (
  result: PromiseLike<{
    data: unknown
    error: { message: string } | null
  }>,
): AcceptHabUnitInviteClient => ({
  rpc(functionName, args) {
    expect(functionName).toEqual(DB_FUNCTION_ACCEPT_HOUSEHOLD_INVITE)
    expect(args).toEqual({ invite_code: INVITE_CODE })
    return result
  },
})

describe('acceptHabUnitInvite', () => {
  test('returns joined with the hab unit id when the rpc returns a string', async () => {
    const client = createAcceptClientStub(
      Promise.resolve({ data: HAB_UNIT_ID, error: null }),
    )

    await expect(acceptHabUnitInvite(INVITE_CODE, client)).resolves.toEqual({
      status: 'joined',
      habUnitId: HAB_UNIT_ID,
    })
  })

  test.each([
    [
      'malformed',
      'accept_household_invite rejects a malformed invite code',
    ],
    [
      'already-has-hab-unit',
      'accept_household_invite refuses a caller who already has a hab unit',
    ],
    ['unknown', 'accept_household_invite refuses an unknown invite code'],
    ['used', 'accept_household_invite refuses a used invite code'],
    ['expired', 'accept_household_invite refuses an expired invite code'],
  ] as const)(
    'returns refused with reason %s when the rpc raises that refusal',
    async (reason, message) => {
      const client = createAcceptClientStub(
        Promise.resolve({
          data: null,
          error: { message },
        }),
      )

      await expect(acceptHabUnitInvite(INVITE_CODE, client)).resolves.toEqual({
        status: 'refused',
        reason,
      })
    },
  )

  test('throws an error that names accept_household_invite and keeps the rpc error as cause when the rpc returns an unrelated error', async () => {
    const rpcError = { message: 'permission denied' }
    const client = createAcceptClientStub(
      Promise.resolve({ data: null, error: rpcError }),
    )

    await expect(acceptHabUnitInvite(INVITE_CODE, client)).rejects.toMatchObject(
      {
        message: 'accept_household_invite failed',
        cause: rpcError,
      },
    )
  })

  test('throws an error that names accept_household_invite when the rpc result is not a string', async () => {
    const client = createAcceptClientStub(
      Promise.resolve({ data: 15, error: null }),
    )

    await expect(acceptHabUnitInvite(INVITE_CODE, client)).rejects.toMatchObject(
      {
        message: 'accept_household_invite failed',
        cause: {
          message: 'accept_household_invite returned a non-string result',
        },
      },
    )
  })
})
