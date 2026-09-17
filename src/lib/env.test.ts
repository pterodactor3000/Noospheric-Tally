import { describe, expect, test, vi } from 'vitest'
import { getSupabaseEnv } from './env'

const NEXT_PUBLIC_SUPABASE_URL = 'https://test.supa.base'
const NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'publishable_key'
const NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon_key'

interface SupabaseEnvStub {
  supabaseUrl: string | undefined
  supabasePublishableKey?: string | undefined
  supabaseAnonKey?: string | undefined
}

const runWithSupabaseEnv = (env: SupabaseEnvStub, run: () => void) => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', env.supabaseUrl)
  vi.stubEnv(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    env.supabasePublishableKey,
  )
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', env.supabaseAnonKey)

  try {
    run()
  } finally {
    vi.unstubAllEnvs()
  }
}

describe('getSupabaseEnv', () => {
  test('returns the publishable key when that variable is set', () => {
    runWithSupabaseEnv(
      {
        supabaseUrl: NEXT_PUBLIC_SUPABASE_URL,
        supabasePublishableKey: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      },
      () => {
        expect(getSupabaseEnv()).toEqual({
          supabaseUrl: NEXT_PUBLIC_SUPABASE_URL,
          supabasePublishableKey: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        })
      },
    )
  })

  test('falls back to the anon key when the publishable key is absent', () => {
    runWithSupabaseEnv(
      {
        supabaseUrl: NEXT_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
      () => {
        expect(getSupabaseEnv()).toEqual({
          supabaseUrl: NEXT_PUBLIC_SUPABASE_URL,
          supabasePublishableKey: NEXT_PUBLIC_SUPABASE_ANON_KEY,
        })
      },
    )
  })

  test('prefers the publishable key when both keys are set', () => {
    runWithSupabaseEnv(
      {
        supabaseUrl: NEXT_PUBLIC_SUPABASE_URL,
        supabasePublishableKey: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        supabaseAnonKey: NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
      () => {
        expect(getSupabaseEnv()).toEqual({
          supabaseUrl: NEXT_PUBLIC_SUPABASE_URL,
          supabasePublishableKey: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        })
      },
    )
  })

  test('throws naming the URL variable when it is absent', () => {
    runWithSupabaseEnv(
      {
        supabaseUrl: undefined,
        supabasePublishableKey: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      },
      () => {
        expect(() => getSupabaseEnv()).toThrow(
          'Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_URL',
        )
      },
    )
  })

  test('throws naming both key variables when neither key is set', () => {
    runWithSupabaseEnv(
      { supabaseUrl: NEXT_PUBLIC_SUPABASE_URL },
      () => {
        expect(() => getSupabaseEnv()).toThrow(
          'Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)',
        )
      },
    )
  })

  test('throws when a variable is present but empty', () => {
    runWithSupabaseEnv(
      {
        supabaseUrl: '',
        supabasePublishableKey: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      },
      () => {
        expect(() => getSupabaseEnv()).toThrow(
          'Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_URL',
        )
      },
    )

    runWithSupabaseEnv(
      { supabaseUrl: NEXT_PUBLIC_SUPABASE_URL, supabasePublishableKey: '' },
      () => {
        expect(() => getSupabaseEnv()).toThrow(
          'Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)',
        )
      },
    )
  })
})
export { runWithSupabaseEnv }
