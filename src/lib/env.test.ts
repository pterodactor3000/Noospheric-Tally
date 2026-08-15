import { expect, it, vi } from 'vitest'
import { getSupabaseEnv } from './env'

const NEXT_PUBLIC_SUPABASE_URL = 'https://test.supa.base'
const NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon_key'

interface SupabaseEnvStub {
  supabaseUrl: string | undefined
  supabaseAnonKey: string | undefined
}

const runWithSupabaseEnv = (env: SupabaseEnvStub, run: () => void) => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', env.supabaseUrl)
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', env.supabaseAnonKey)

  try {
    run()
  } finally {
    vi.unstubAllEnvs()
  }
}

it('returns both values when the environment is complete', () => {
  runWithSupabaseEnv(
    {
      supabaseUrl: NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    () => {
      expect(getSupabaseEnv()).toEqual({
        supabaseUrl: NEXT_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: NEXT_PUBLIC_SUPABASE_ANON_KEY,
      })
    },
  )
})

it('throws naming the URL variable when it is absent', () => {
  runWithSupabaseEnv(
    { supabaseUrl: undefined, supabaseAnonKey: NEXT_PUBLIC_SUPABASE_ANON_KEY },
    () => {
      expect(() => getSupabaseEnv()).toThrow(
        'Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_URL',
      )
    },
  )
})

it('throws naming the anon key variable when it is absent', () => {
  runWithSupabaseEnv(
    { supabaseUrl: NEXT_PUBLIC_SUPABASE_URL, supabaseAnonKey: undefined },
    () => {
      expect(() => getSupabaseEnv()).toThrow(
        'Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY',
      )
    },
  )
})

it('throws when a variable is present but empty', () => {
  runWithSupabaseEnv(
    { supabaseUrl: '', supabaseAnonKey: NEXT_PUBLIC_SUPABASE_ANON_KEY },
    () => {
      expect(() => getSupabaseEnv()).toThrow(
        'Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_URL',
      )
    },
  )

  runWithSupabaseEnv(
    { supabaseUrl: NEXT_PUBLIC_SUPABASE_URL, supabaseAnonKey: '' },
    () => {
      expect(() => getSupabaseEnv()).toThrow(
        'Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY',
      )
    },
  )
})

export { runWithSupabaseEnv }
