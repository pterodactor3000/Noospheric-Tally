import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { getSupabaseEnv } from '../env'
import { writeAuthCookies } from './writeAuthCookies'

export async function createClient() {
  const cookieStore = await cookies()
  const supabaseEnv = getSupabaseEnv()

  return createServerClient(
    supabaseEnv.supabaseUrl,
    supabaseEnv.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          writeAuthCookies(cookieStore, cookiesToSet)
        },
      },
    },
  )
}
