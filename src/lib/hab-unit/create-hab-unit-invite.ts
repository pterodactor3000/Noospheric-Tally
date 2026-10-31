import { DB_FUNCTION_CREATE_HOUSEHOLD_INVITE } from '../db/entities'

interface CreatedHabUnitInvite {
  readonly inviteCode: string
  readonly expiresAt: string
}

interface CreateHabUnitInviteClient {
  rpc(
    functionName: typeof DB_FUNCTION_CREATE_HOUSEHOLD_INVITE,
  ): PromiseLike<{
    data: unknown
    error: { message: string } | null
  }>
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readCreatedHabUnitInvite = (
  data: unknown,
): CreatedHabUnitInvite | null => {
  if (!Array.isArray(data) || data.length !== 1) {
    return null
  }

  const row: unknown = data[0]
  if (!isRecord(row)) {
    return null
  }

  const { invite_code: inviteCode, invite_expires_at: expiresAt } = row
  if (typeof inviteCode !== 'string' || typeof expiresAt !== 'string') {
    return null
  }

  return { inviteCode, expiresAt }
}

const createHabUnitInvite = async (
  client: CreateHabUnitInviteClient,
): Promise<CreatedHabUnitInvite> => {
  const { data, error } = await client.rpc(DB_FUNCTION_CREATE_HOUSEHOLD_INVITE)

  const invite = error ? null : readCreatedHabUnitInvite(data)
  if (!invite) {
    throw new Error(
      'create_household_invite failed',
      error ? { cause: error } : undefined,
    )
  }

  return invite
}

export { createHabUnitInvite }
export type { CreateHabUnitInviteClient, CreatedHabUnitInvite }
