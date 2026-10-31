import { DB_FUNCTION_ACCEPT_HOUSEHOLD_INVITE } from '../db/entities'

interface AcceptHabUnitInviteClient {
  rpc(
    functionName: typeof DB_FUNCTION_ACCEPT_HOUSEHOLD_INVITE,
    args: { invite_code: string },
  ): PromiseLike<{
    data: unknown
    error: { message: string } | null
  }>
}

const HAB_UNIT_INVITE_REFUSAL_REASONS = {
  'accept_household_invite rejects a malformed invite code': 'malformed',
  'accept_household_invite refuses a caller who already has a hab unit':
    'already-has-hab-unit',
  'accept_household_invite refuses an unknown invite code': 'unknown',
  'accept_household_invite refuses a used invite code': 'used',
  'accept_household_invite refuses an expired invite code': 'expired',
} as const

type HabUnitInviteRefusalMessage = keyof typeof HAB_UNIT_INVITE_REFUSAL_REASONS

type HabUnitInviteRefusalReason =
  (typeof HAB_UNIT_INVITE_REFUSAL_REASONS)[HabUnitInviteRefusalMessage]

interface JoinedHabUnitInvite {
  readonly status: 'joined'
  readonly habUnitId: string
}

interface RefusedHabUnitInvite {
  readonly status: 'refused'
  readonly reason: HabUnitInviteRefusalReason
}

type AcceptHabUnitInviteResult = JoinedHabUnitInvite | RefusedHabUnitInvite

const isHabUnitInviteRefusalMessage = (
  message: string,
): message is HabUnitInviteRefusalMessage =>
  Object.hasOwn(HAB_UNIT_INVITE_REFUSAL_REASONS, message)

const readHabUnitInviteRefusalReason = (
  message: string,
): HabUnitInviteRefusalReason | null => {
  if (!isHabUnitInviteRefusalMessage(message)) {
    return null
  }

  return HAB_UNIT_INVITE_REFUSAL_REASONS[message]
}

const acceptHabUnitInvite = async (
  inviteCode: string,
  client: AcceptHabUnitInviteClient,
): Promise<AcceptHabUnitInviteResult> => {
  const { data, error } = await client.rpc(
    DB_FUNCTION_ACCEPT_HOUSEHOLD_INVITE,
    { invite_code: inviteCode },
  )

  if (error) {
    const reason = readHabUnitInviteRefusalReason(error.message)
    if (reason) {
      return { status: 'refused', reason }
    }

    throw new Error('accept_household_invite failed', { cause: error })
  }

  if (typeof data === 'string') {
    return { status: 'joined', habUnitId: data }
  }

  throw new Error('accept_household_invite failed', {
    cause: new Error('accept_household_invite returned a non-string result'),
  })
}

export { acceptHabUnitInvite }
export type {
  AcceptHabUnitInviteClient,
  AcceptHabUnitInviteResult,
  HabUnitInviteRefusalReason,
}
