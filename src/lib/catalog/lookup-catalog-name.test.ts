import { describe, expect, test, vi } from 'vitest'

import packageJson from '../../../package.json'

const BARCODE = '3017620422003'
const USER_AGENT = `NoosphericTally/${packageJson.version} (pterodactor@pm.me)`

const BEAUTY_CATALOG_URL = 'https://beauty.example/api/v2/product/'
const FOOD_CATALOG_URL = 'https://food.example/api/v2/product/'
const PET_CATALOG_URL = 'https://pet.example/api/v2/product/'
const PRODUCTS_CATALOG_URL = 'https://products.example/api/v2/product/'

const CATALOG_URLS = [
  BEAUTY_CATALOG_URL,
  FOOD_CATALOG_URL,
  PET_CATALOG_URL,
  PRODUCTS_CATALOG_URL,
]

const emptyLookup = {
  status: 'empty',
} as const

interface CatalogFetchInit {
  headers: {
    'User-Agent': string
  }
  signal: AbortSignal
}

type LookupCatalogName =
  typeof import('./lookup-catalog-name').lookupCatalogName

type CatalogFetch = (
  url: string,
  init: CatalogFetchInit,
) => Promise<Response>

const catalogRequestUrl = (catalogUrl: string) =>
  `${catalogUrl}${BARCODE}?fields=product_name,product_name_en`

const createProductResponse = (productName: string) =>
  Response.json({
    code: BARCODE,
    product: {
      product_name: productName,
      product_name_en: `${productName} en`,
    },
    status: 1,
    status_verbose: 'product found',
  })

const runWithCatalogEnv = async (
  run: (lookupCatalogName: LookupCatalogName) => Promise<void>,
) => {
  vi.resetModules()
  vi.stubEnv('OPENBEAUTYFACTS_API_URL', BEAUTY_CATALOG_URL)
  vi.stubEnv('OPENFOODFACTS_API_URL', FOOD_CATALOG_URL)
  vi.stubEnv('OPENPETFOODFACTS_API_URL', PET_CATALOG_URL)
  vi.stubEnv('OPENPRODUCTSFACTS_API_URL', PRODUCTS_CATALOG_URL)

  try {
    const catalogModule = await import('./lookup-catalog-name')
    await run(catalogModule.lookupCatalogName)
  } finally {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  }
}

describe('lookupCatalogName', () => {
  test('returns the product name when a catalog responds with HTTP 200', async () => {
    await runWithCatalogEnv(async (lookupCatalogName) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => createProductResponse('Nutella')),
      )

      await expect(lookupCatalogName(BARCODE)).resolves.toEqual({
        status: 'found',
        name: 'Nutella',
      })
    })
  })

  test('returns product_name when product_name_en is different', async () => {
    await runWithCatalogEnv(async (lookupCatalogName) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () =>
          Response.json({
            code: BARCODE,
            product: {
              product_name: 'Nom français',
              product_name_en: 'English name',
            },
            status: 1,
            status_verbose: 'product found',
          }),
        ),
      )

      await expect(lookupCatalogName(BARCODE)).resolves.toEqual({
        status: 'found',
        name: 'Nom français',
      })
    })
  })

  test('truncates a product name longer than 120 characters', async () => {
    const productName = 'n'.repeat(121)

    await runWithCatalogEnv(async (lookupCatalogName) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => createProductResponse(productName)),
      )

      await expect(lookupCatalogName(BARCODE)).resolves.toEqual({
        status: 'found',
        name: 'n'.repeat(120),
      })
    })
  })

  test('uses product_name_en when product_name is blank', async () => {
    await runWithCatalogEnv(async (lookupCatalogName) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () =>
          Response.json({
            code: BARCODE,
            product: {
              product_name: '   ',
              product_name_en: '  English name  ',
            },
            status: 1,
            status_verbose: 'product found',
          }),
        ),
      )

      await expect(lookupCatalogName(BARCODE)).resolves.toEqual({
        status: 'found',
        name: 'English name',
      })
    })
  })

  test('returns empty when both catalog names are blank', async () => {
    await runWithCatalogEnv(async (lookupCatalogName) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () =>
          Response.json({
            code: BARCODE,
            product: {
              product_name: ' ',
              product_name_en: '',
            },
            status: 1,
            status_verbose: 'product found',
          }),
        ),
      )

      await expect(lookupCatalogName(BARCODE)).resolves.toEqual(emptyLookup)
    })
  })

  test('returns the name from a later catalog when earlier catalogs fail', async () => {
    await runWithCatalogEnv(async (lookupCatalogName) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string) => {
          if (url.startsWith(FOOD_CATALOG_URL)) {
            return createProductResponse('Nutella')
          }

          return new Response(null, { status: 404 })
        }),
      )

      await expect(lookupCatalogName(BARCODE)).resolves.toEqual({
        status: 'found',
        name: 'Nutella',
      })
    })
  })

  test('returns empty when every catalog responds with a non-200 status', async () => {
    await runWithCatalogEnv(async (lookupCatalogName) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(null, { status: 404 })),
      )

      await expect(lookupCatalogName(BARCODE)).resolves.toEqual(emptyLookup)
    })
  })

  test('returns empty when every catalog request throws', async () => {
    await runWithCatalogEnv(async (lookupCatalogName) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => {
          throw new Error('network down')
        }),
      )

      await expect(lookupCatalogName(BARCODE)).resolves.toEqual(emptyLookup)
    })
  })

  test('returns empty when the response body is not JSON', async () => {
    await runWithCatalogEnv(async (lookupCatalogName) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(
          async () =>
            new Response('not-json', {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }),
        ),
      )

      await expect(lookupCatalogName(BARCODE)).resolves.toEqual(emptyLookup)
    })
  })

  test('returns empty when the product is missing', async () => {
    await runWithCatalogEnv(async (lookupCatalogName) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () =>
          Response.json({
            code: BARCODE,
            status: 0,
            status_verbose: 'product not found',
          }),
        ),
      )

      await expect(lookupCatalogName(BARCODE)).resolves.toEqual(emptyLookup)
    })
  })

  test('requests each catalog URL with the barcode and name fields', async () => {
    await runWithCatalogEnv(async (lookupCatalogName) => {
      const fetchMock = vi.fn<CatalogFetch>(async () =>
        createProductResponse('Nutella'),
      )
      vi.stubGlobal('fetch', fetchMock)

      await lookupCatalogName(BARCODE)

      expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(
        CATALOG_URLS.map((catalogUrl) => catalogRequestUrl(catalogUrl)),
      )
    })
  })

  test('sends the project User-Agent on each catalog request', async () => {
    await runWithCatalogEnv(async (lookupCatalogName) => {
      const fetchMock = vi.fn<CatalogFetch>(async () =>
        createProductResponse('Nutella'),
      )
      vi.stubGlobal('fetch', fetchMock)

      await lookupCatalogName(BARCODE)

      expect(fetchMock.mock.calls.map(([, init]) => init.headers)).toEqual(
        CATALOG_URLS.map(() => ({
          'User-Agent': USER_AGENT,
        })),
      )
    })
  })

  test('aborts the other catalog requests after one responds', async () => {
    await runWithCatalogEnv(async (lookupCatalogName) => {
      const pendingSignals: AbortSignal[] = []

      vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string, init: CatalogFetchInit) => {
          if (url.startsWith(FOOD_CATALOG_URL)) {
            return createProductResponse('Nutella')
          }

          pendingSignals.push(init.signal)
          return new Promise<Response>(() => undefined)
        }),
      )

      await expect(lookupCatalogName(BARCODE)).resolves.toEqual({
        status: 'found',
        name: 'Nutella',
      })

      expect(pendingSignals.map((signal) => signal.aborted)).toEqual([
        true,
        true,
        true,
      ])
    })
  })

  test('returns empty when every catalog request times out', async () => {
    await runWithCatalogEnv(async (lookupCatalogName) => {
      vi.stubGlobal(
        'fetch',
        vi.fn((_url: string, init: CatalogFetchInit) => {
          return new Promise<Response>((_resolve, reject) => {
            init.signal.addEventListener('abort', () => {
              reject(init.signal.reason)
            })
          })
        }),
      )

      await expect(lookupCatalogName(BARCODE)).resolves.toEqual(emptyLookup)
    })
  }, 10000)
})
