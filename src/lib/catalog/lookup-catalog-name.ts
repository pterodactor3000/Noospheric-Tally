import { fetchHttp200 } from '../fetchHttp200'
import {
  DEFAULT_ITEM_CATEGORY,
  type ItemCategory,
} from '../items/item-category'

interface LookupStatusFound {
  readonly status: 'found'
  readonly name: string
  readonly category: ItemCategory
}

interface LookupStatusEmpty {
  readonly status: 'empty'
  readonly category: ItemCategory
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
  // The category array and the URL array share an order.
  const CATALOG_CATEGORIES = [
    'beauty',
    'food',
    'pet-food',
    'other',
  ] as const satisfies readonly ItemCategory[]
  const catalogUrls = [
    `${process.env.OPENBEAUTYFACTS_API_URL}${barcode}?fields=product_name,product_name_en`,
    `${process.env.OPENFOODFACTS_API_URL}${barcode}?fields=product_name,product_name_en`,
    `${process.env.OPENPETFOODFACTS_API_URL}${barcode}?fields=product_name,product_name_en`,
    `${process.env.OPENPRODUCTSFACTS_API_URL}${barcode}?fields=product_name,product_name_en`,
  ]

  const abortControllers = catalogUrls.map(() => new AbortController())
  let category: ItemCategory = DEFAULT_ITEM_CATEGORY

  try {
    console.log('lookup catalog name', barcode)
    const winningCatalog = await Promise.any(
      catalogUrls.map(async (url, index) => {
        const response = await fetchHttp200(
          url,
          AbortSignal.any([
            abortControllers[index].signal,
            AbortSignal.timeout(CATALOG_TIMEOUT_MS),
          ]),
        )

        console.log('lookup catalog name fetch', response)
        return {
          index,
          response,
        }
      }),
    )

    category = CATALOG_CATEGORIES[winningCatalog.index]

    abortControllers.forEach((controller, index) => {
      if (index !== winningCatalog.index) {
        controller.abort()
      }
    })

    const data: unknown = await winningCatalog.response.json()
    abortControllers[winningCatalog.index].abort()

    const name = readCatalogName(data)
    if (!name) {
      return {
        status: 'empty',
        category,
      }
    }

    return {
      status: 'found',
      name,
      category,
    }
  } catch {
    return {
      status: 'empty',
      category,
    }
  } finally {
    abortControllers.forEach((controller) => controller.abort())
  }
}

export { lookupCatalogName }
