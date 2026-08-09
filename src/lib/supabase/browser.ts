import { createBrowserClient } from "@supabase/ssr"
import { getSupabaseEnv } from "../env"

const createClient = () => {
  const supabaseEnv = getSupabaseEnv()

  return createBrowserClient(
    supabaseEnv.supabaseUrl,
    supabaseEnv.supabaseAnonKey,
  )
}
export { createClient }
