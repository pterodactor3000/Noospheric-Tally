import { fetchHttp200 } from '../fetchHttp200'

interface LookupStatusFound {
  readonly status: 'found'
  readonly name: string
}

interface LookupStatusEmpty {
  readonly status: 'empty'
}

type LookupStatus = LookupStatusEmpty | LookupStatusFound

const MAX_CATALOG_NAME_LENGTH = 120
const CATALOG_TIMEOUT_MS = 3000

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readCatalogName = (value: unknown): string | null => {
  if (!isRecord(value) || !isRecord(value.product)) {
    return null
  }

  const productName = value.product.product_name
  const productNameEn = value.product.product_name_en
  const chosenName =
    typeof productName === 'string' && productName.trim().length > 0
      ? productName
      : productNameEn

  if (typeof chosenName !== 'string') {
    return null
  }

  const trimmedName = chosenName.trim()
  if (trimmedName.length === 0) {
    return null
  }

  return trimmedName.slice(0, MAX_CATALOG_NAME_LENGTH)
}

const lookupCatalogName = async (barcode: string): Promise<LookupStatus> => {
  const catalogUrls = [
    `${process.env.OPENBEAUTYFACTS_API_URL}${barcode}?fields=product_name,product_name_en`,
    `${process.env.OPENFOODFACTS_API_URL}${barcode}?fields=product_name,product_name_en`,
    `${process.env.OPENPETFOODFACTS_API_URL}${barcode}?fields=product_name,product_name_en`,
    `${process.env.OPENPRODUCTSFACTS_API_URL}${barcode}?fields=product_name,product_name_en`,
  ]

  const abortControllers = catalogUrls.map(() => new AbortController())

  try {
    const response = await Promise.any(
      catalogUrls.map((url, index) =>
        fetchHttp200(
          url,
          AbortSignal.any([
            abortControllers[index].signal,
            AbortSignal.timeout(CATALOG_TIMEOUT_MS),
          ]),
        ),
      ),
    )

    abortControllers.forEach((controller) => controller.abort())

    const data: unknown = await response.json()
    const name = readCatalogName(data)
    if (!name) {
      return {
        status: 'empty',
      }
    }

    return {
      status: 'found',
      name,
    }
  } catch (error) {
    abortControllers.forEach((controller) => controller.abort())
    if (error instanceof AggregateError) {
      return {
        status: 'empty',
      }
    }
    return {
      status: 'empty',
    }
  }
}

export { lookupCatalogName }
