import type { CookieOptions } from '@supabase/ssr'

interface AuthCookieStore {
  set: (name: string, value: string, options?: CookieOptions) => void
}

interface AuthCookieToSet {
  name: string
  value: string
  options: CookieOptions
}

const READONLY_COOKIES_ERROR_FRAGMENT =
  'Cookies can only be modified in a Server Action or Route Handler'

const writeAuthCookies = (
  cookieStore: AuthCookieStore,
  cookiesToSet: AuthCookieToSet[],
): void => {
  try {
    cookiesToSet.forEach(({ name, value, options }) => {
      cookieStore.set(name, value, options)
    })
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes(READONLY_COOKIES_ERROR_FRAGMENT)
    ) {
      return
    }

    throw error
  }
}

export { writeAuthCookies }
