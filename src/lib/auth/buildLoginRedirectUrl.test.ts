import { describe, expect, test } from 'vitest'

import { buildLoginRedirectUrl } from './buildLoginRedirectUrl'

describe('buildLoginRedirectUrl', () => {
  test('drops the invite code from a hab-unit join link', () => {
    const loginUrl = buildLoginRedirectUrl(
      new URL(
        'http://localhost:3000/hab-unit/new?code=0123456789abcdef0123456789abcdef',
      ),
    )

    expect(loginUrl.pathname).toEqual('/login')
    expect(loginUrl.search).toEqual('')
  })

  test('drops the invite code and keeps other query parameters', () => {
    const loginUrl = buildLoginRedirectUrl(
      new URL('http://localhost:3000/hab-unit/new?code=abc&next=inventory'),
    )

    expect(loginUrl.pathname).toEqual('/login')
    expect(loginUrl.searchParams.get('code')).toEqual(null)
    expect(loginUrl.searchParams.get('next')).toEqual('inventory')
  })

  test('keeps a barcode query on an inventory path', () => {
    const loginUrl = buildLoginRedirectUrl(
      new URL('http://localhost:3000/inventory/scan?barcode=1234567890123'),
    )

    expect(loginUrl.pathname).toEqual('/login')
    expect(loginUrl.searchParams.get('barcode')).toEqual('1234567890123')
  })
})
