import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { getSupabaseEnv } from '../env'

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
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error: unknown) {
            console.error('setSupabaseAuthCookies failed', error)
          }
        },
      },
    },
  )
}
