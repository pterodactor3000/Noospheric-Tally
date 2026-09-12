interface HealthyCheck {
  status: 'ok'
}

interface UnhealthyCheck {
  status: 'unhealthy'
  message: string
}

type HealthCheckResult = HealthyCheck | UnhealthyCheck

interface SupabaseHealthClient {
  rpc(functionName: 'ping_database'): PromiseLike<{
    error: { message: string } | null
  }>
}

const PING_DATABASE_RPC = 'ping_database'

const checkSupabaseHealth = async (
  client: SupabaseHealthClient,
): Promise<HealthCheckResult> => {
  try {
    const { error } = await client.rpc(PING_DATABASE_RPC)

    if (error) {
      return {
        status: 'unhealthy',
        message: `Supabase health check rpc failed for ${PING_DATABASE_RPC}: ${error.message}`,
      }
    }

    return { status: 'ok' }
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : 'unknown error'
    return {
      status: 'unhealthy',
      message: `Supabase health check rpc failed for ${PING_DATABASE_RPC}: ${detail}`,
    }
  }
}

export { checkSupabaseHealth }
export type { HealthCheckResult, SupabaseHealthClient }
