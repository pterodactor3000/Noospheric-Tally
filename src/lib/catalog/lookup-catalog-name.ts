import {
  OPENBEAUTYFACTS_API_URL,
  OPENFOODFACTS_API_URL,
  OPENPETFOODFACTS_API_URL,
  OPENPRODUCTSFACTS_API_URL,
} from '../definitions'
import { fetchHttp200 } from '../fetchHttp200'
import { OpenProduct } from '../types'

interface LookupStatusFound {
  readonly status: 'found'
  readonly name: string
}

interface LookupStatusEmpty {
  readonly status: 'empty'
}

type LookupStatus = LookupStatusEmpty | LookupStatusFound

const lookupCatalogName = async (barcode: string): Promise<LookupStatus> => {
  const catalogUrls = [
    `${OPENBEAUTYFACTS_API_URL}${barcode}?fields=product_name,product_name_en`,
    `${OPENFOODFACTS_API_URL}${barcode}?fields=product_name,product_name_en`,
    `${OPENPETFOODFACTS_API_URL}${barcode}?fields=product_name,product_name_en`,
    `${OPENPRODUCTSFACTS_API_URL}${barcode}?fields=product_name,product_name_en`,
  ]

  const abortControllers = catalogUrls.map(() => new AbortController())

  try {
    const response = await Promise.any(
      catalogUrls.map((url, index) =>
        fetchHttp200(url, abortControllers[index].signal),
      ),
    )

    abortControllers.forEach((controller) => controller.abort())

    const data = (await response.json()) as unknown as OpenProduct

    return {
      status: 'found',
      name: data.product.product_name,
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
