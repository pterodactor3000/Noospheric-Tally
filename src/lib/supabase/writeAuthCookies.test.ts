import { describe, expect, test, vi } from 'vitest'

import { writeAuthCookies } from './writeAuthCookies'

const AUTH_COOKIE = {
  name: 'sb-auth-token',
  value: 'token',
  options: { path: '/' },
}

describe('writeAuthCookies', () => {
  test('writes each cookie onto the store', () => {
    const cookieStore = { set: vi.fn() }

    writeAuthCookies(cookieStore, [AUTH_COOKIE])

    expect(cookieStore.set).toHaveBeenCalledWith(
      AUTH_COOKIE.name,
      AUTH_COOKIE.value,
      AUTH_COOKIE.options,
    )
  })

  test('ignores the Next.js Server Component cookie-write error', () => {
    const cookieStore = {
      set: vi.fn(() => {
        throw new Error(
          'Cookies can only be modified in a Server Action or Route Handler. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#options',
        )
      }),
    }

    expect(() => writeAuthCookies(cookieStore, [AUTH_COOKIE])).not.toThrow()
  })

  test('rethrows unexpected cookie-write failures', () => {
    const cookieStore = {
      set: vi.fn(() => {
        throw new Error('quota exceeded')
      }),
    }

    expect(() => writeAuthCookies(cookieStore, [AUTH_COOKIE])).toThrow(
      'quota exceeded',
    )
  })
})
