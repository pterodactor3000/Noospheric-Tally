interface Item {
  readonly itemId: string
  readonly name: string
}

interface OpenProduct {
  readonly code: string
  readonly product: {
    readonly product_name: string
    readonly product_name_en: string
  }
  readonly status: number
  readonly status_verbose: string
}

export { type Item, type OpenProduct }
