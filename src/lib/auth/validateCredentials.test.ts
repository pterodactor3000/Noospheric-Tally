import { describe, expect, test } from 'vitest'

import { validateCredentials } from './validateCredentials'

const VALID_EMAIL = 'owner@example.com'
const VALID_PASSWORD = 'secret1'

describe('validateCredentials', () => {
  test('returns trimmed credentials when the pair is valid', () => {
    expect(
      validateCredentials({
        email: VALID_EMAIL,
        password: VALID_PASSWORD,
      }),
    ).toEqual({
      status: 'valid',
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
    })
  })

  test('returns an email error when email is missing', () => {
    expect(
      validateCredentials({ email: '', password: VALID_PASSWORD }),
    ).toEqual({
      status: 'invalid',
      field: 'email',
      message: 'Enter an email address.',
    })
  })

  test('returns an email error when email is malformed', () => {
    expect(
      validateCredentials({ email: 'not-an-email', password: VALID_PASSWORD }),
    ).toEqual({
      status: 'invalid',
      field: 'email',
      message: 'Enter a valid email address.',
    })
  })

  test('returns a password error when password is missing', () => {
    expect(validateCredentials({ email: VALID_EMAIL, password: '' })).toEqual({
      status: 'invalid',
      field: 'password',
      message: 'Enter a password.',
    })
  })

  test('returns a password error when password is below the minimum length', () => {
    expect(
      validateCredentials({ email: VALID_EMAIL, password: '12345' }),
    ).toEqual({
      status: 'invalid',
      field: 'password',
      message: 'Password must be at least 6 characters.',
    })
  })

  test('trims surrounding whitespace on a valid pair', () => {
    expect(
      validateCredentials({
        email: `  ${VALID_EMAIL}  `,
        password: `  ${VALID_PASSWORD}  `,
      }),
    ).toEqual({
      status: 'valid',
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
    })
  })
})
