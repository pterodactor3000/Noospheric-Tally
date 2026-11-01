interface ValidHabUnitInviteCode {
  readonly status: 'valid'
  readonly code: string
}

interface InvalidHabUnitInviteCode {
  readonly status: 'invalid'
  readonly message: string
}

type HabUnitInviteCodeValidationResult =
  | ValidHabUnitInviteCode
  | InvalidHabUnitInviteCode

const INVITE_CODE_INVALID_MESSAGE =
  'Invite code is not valid. Check it and try again.'

const INVITE_CODE_PATTERN = /^[0-9a-f]{32}$/

const validateHabUnitInviteCode = (
  code: string,
): HabUnitInviteCodeValidationResult => {
  const normalizedCode = code.trim().toLowerCase()

  if (!INVITE_CODE_PATTERN.test(normalizedCode)) {
    return {
      status: 'invalid',
      message: INVITE_CODE_INVALID_MESSAGE,
    }
  }

  return {
    status: 'valid',
    code: normalizedCode,
  }
}

export {
  validateHabUnitInviteCode,
  type HabUnitInviteCodeValidationResult,
  type ValidHabUnitInviteCode,
}
