type SupabaseEnv = {
  supabaseUrl: string
  supabaseAnonKey: string
}

const getSupabaseEnv = (): SupabaseEnv => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error(
      "Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_URL",
    )
  }

  if (!supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY",
    )
  }

  return { supabaseUrl, supabaseAnonKey }
}

export { getSupabaseEnv }
