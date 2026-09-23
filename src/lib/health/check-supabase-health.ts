import { DB_FUNCTION_PING_DATABASE } from '../db/entities'

interface HealthyCheck {
  status: 'ok'
}

interface UnhealthyCheck {
  status: 'unhealthy'
  message: string
}

type HealthCheckResult = HealthyCheck | UnhealthyCheck

interface SupabaseHealthClient {
  rpc(functionName: typeof DB_FUNCTION_PING_DATABASE): PromiseLike<{
    error: { message: string } | null
  }>
}

const checkSupabaseHealth = async (
  client: SupabaseHealthClient,
): Promise<HealthCheckResult> => {
  try {
    const { error } = await client.rpc(DB_FUNCTION_PING_DATABASE)

    if (error) {
      return {
        status: 'unhealthy',
        message: `Supabase health check rpc failed for ${DB_FUNCTION_PING_DATABASE}: ${error.message}`,
      }
    }

    return { status: 'ok' }
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : 'unknown error'
    return {
      status: 'unhealthy',
      message: `Supabase health check rpc failed for ${DB_FUNCTION_PING_DATABASE}: ${detail}`,
    }
  }
}

export { checkSupabaseHealth }
export type { HealthCheckResult, SupabaseHealthClient }
