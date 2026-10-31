import { describe, expect, test } from 'vitest'

import { DB_FUNCTION_CREATE_HOUSEHOLD_INVITE } from '../db/entities'
import {
  createHabUnitInvite,
  type CreateHabUnitInviteClient,
} from './create-hab-unit-invite'

const INVITE_CODE = '0123456789abcdef0123456789abcdef'
const EXPIRES_AT = '2026-11-07T20:00:00.000Z'

const createInviteClientStub = (
  result: PromiseLike<{
    data: unknown
    error: { message: string } | null
  }>,
): CreateHabUnitInviteClient => ({
  rpc(functionName) {
    expect(functionName).toEqual(DB_FUNCTION_CREATE_HOUSEHOLD_INVITE)
    return result
  },
})

describe('createHabUnitInvite', () => {
  test('returns the invite code and expiry from a successful rpc', async () => {
    const client = createInviteClientStub(
      Promise.resolve({
        data: [{ invite_code: INVITE_CODE, invite_expires_at: EXPIRES_AT }],
        error: null,
      }),
    )

    await expect(createHabUnitInvite(client)).resolves.toEqual({
      inviteCode: INVITE_CODE,
      expiresAt: EXPIRES_AT,
    })
  })

  test('throws an error that names create_household_invite and keeps the rpc error as cause when the rpc returns an error', async () => {
    const rpcError = { message: 'permission denied' }
    const client = createInviteClientStub(
      Promise.resolve({ data: null, error: rpcError }),
    )

    await expect(createHabUnitInvite(client)).rejects.toMatchObject({
      message: 'create_household_invite failed',
      cause: rpcError,
    })
  })

  test('throws an error that names create_household_invite when the rpc returns an empty array', async () => {
    const client = createInviteClientStub(
      Promise.resolve({ data: [], error: null }),
    )

    await expect(createHabUnitInvite(client)).rejects.toMatchObject({
      message: 'create_household_invite failed',
    })
  })

  test('throws an error that names create_household_invite when the row is missing a field', async () => {
    const client = createInviteClientStub(
      Promise.resolve({
        data: [{ invite_code: INVITE_CODE }],
        error: null,
      }),
    )

    await expect(createHabUnitInvite(client)).rejects.toMatchObject({
      message: 'create_household_invite failed',
    })
  })

  test('throws an error that names create_household_invite when the row has a non-string field', async () => {
    const client = createInviteClientStub(
      Promise.resolve({
        data: [{ invite_code: INVITE_CODE, invite_expires_at: 7 }],
        error: null,
      }),
    )

    await expect(createHabUnitInvite(client)).rejects.toMatchObject({
      message: 'create_household_invite failed',
    })
  })
})
