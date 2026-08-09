import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

import { getSupabaseEnv } from "../env"

export async function createClient() {
  const cookieStore = await cookies()
  const supabaseEnv = getSupabaseEnv()

  return createServerClient(
    supabaseEnv.supabaseUrl,
    supabaseEnv.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    },
  )
}
