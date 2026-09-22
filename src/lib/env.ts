import {
  SUPABASE_ANON_KEY,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from './definitions'

type SupabaseEnv = {
  supabaseUrl: string
  supabasePublishableKey: string
}

const getSupabaseEnv = (): SupabaseEnv => {
  const supabaseUrl = SUPABASE_URL
  const supabasePublishableKey = SUPABASE_PUBLISHABLE_KEY || SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error(
      'Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_URL',
    )
  }

  if (!supabasePublishableKey) {
    throw new Error(
      'Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)',
    )
  }

  return { supabaseUrl, supabasePublishableKey }
}

export { getSupabaseEnv }
