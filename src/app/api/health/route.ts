import { createClient } from '@supabase/supabase-js'

import { getSupabaseEnv } from '@/lib/env'
import { checkSupabaseHealth } from '@/lib/health/check-supabase-health'

export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
}

export async function GET() {
  try {
    const supabaseEnv = getSupabaseEnv()
    const supabase = createClient(
      supabaseEnv.supabaseUrl,
      supabaseEnv.supabaseAnonKey,
    )
    const result = await checkSupabaseHealth(supabase)

    if (result.status === 'unhealthy') {
      return Response.json(
        { status: result.status, message: result.message },
        { status: 503, headers: NO_STORE_HEADERS },
      )
    }

    return Response.json(
      { status: result.status },
      { headers: NO_STORE_HEADERS },
    )
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Supabase health check failed'
    return Response.json(
      { status: 'unhealthy', message },
      { status: 503, headers: NO_STORE_HEADERS },
    )
  }
}
