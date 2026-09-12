import { describe, expect, test } from 'vitest'

import {
  checkSupabaseHealth,
  type SupabaseHealthClient,
} from './check-supabase-health'

const createHealthClientStub = (
  result: PromiseLike<{ error: { message: string } | null }>,
): SupabaseHealthClient => ({
  rpc(functionName) {
    expect(functionName).toEqual('ping_database')
    return result
  },
})

describe('checkSupabaseHealth', () => {
  test('returns ok when the ping rpc succeeds', async () => {
    const client = createHealthClientStub(Promise.resolve({ error: null }))

    await expect(checkSupabaseHealth(client)).resolves.toEqual({
      status: 'ok',
    })
  })

  test('returns unhealthy when the ping rpc returns an error', async () => {
    const client = createHealthClientStub(
      Promise.resolve({ error: { message: 'permission denied' } }),
    )

    await expect(checkSupabaseHealth(client)).resolves.toEqual({
      status: 'unhealthy',
      message:
        'Supabase health check rpc failed for ping_database: permission denied',
    })
  })

  test('returns unhealthy when the ping rpc throws', async () => {
    const client = createHealthClientStub(
      Promise.reject(new Error('network timeout')),
    )

    await expect(checkSupabaseHealth(client)).resolves.toEqual({
      status: 'unhealthy',
      message:
        'Supabase health check rpc failed for ping_database: network timeout',
    })
  })
})
