import { describe, expect, test } from 'vitest'
import { validateHabUnitInviteCode } from './validate-hab-unit-invite-code'

const VALID_CODE = '0123456789abcdef0123456789abcdef'

const invalidResponse = {
  status: 'invalid',
  message: 'Invite code is not valid. Check it and try again.',
}

describe('validateHabUnitInviteCode', () => {
  test('returns an invalid result when the code is empty', () => {
    expect(validateHabUnitInviteCode('')).toEqual(invalidResponse)
  })

  test('returns an invalid result when the code is whitespace only', () => {
    expect(validateHabUnitInviteCode('   ')).toEqual(invalidResponse)
  })

  test('returns a valid result when an uppercase code normalizes', () => {
    expect(validateHabUnitInviteCode(VALID_CODE.toUpperCase())).toEqual({
      status: 'valid',
      code: VALID_CODE,
    })
  })

  test('returns an invalid result when the code is 31 characters', () => {
    expect(validateHabUnitInviteCode(VALID_CODE.slice(0, 31))).toEqual(
      invalidResponse,
    )
  })

  test('returns an invalid result when the code is 33 characters', () => {
    expect(validateHabUnitInviteCode(`${VALID_CODE}a`)).toEqual(
      invalidResponse,
    )
  })

  test('returns an invalid result when the code contains a non-hex character', () => {
    expect(
      validateHabUnitInviteCode(`${VALID_CODE.slice(0, 31)}g`),
    ).toEqual(invalidResponse)
  })

  test('returns a valid result when a valid code has surrounding spaces', () => {
    expect(validateHabUnitInviteCode(`  ${VALID_CODE}  `)).toEqual({
      status: 'valid',
      code: VALID_CODE,
    })
  })
})
