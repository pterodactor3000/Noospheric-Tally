interface LookupStatusFound {
  readonly status: 'found'
  readonly name: string
}

interface LookupStatusEmpty {
  readonly status: 'empty'
}

const lookupCatalogName = async (barcode: string) => {
  const userAgent = {
    'User-Agent': 'Noospheric Tally/ (pterodactor@pm.me)'
  }
  const url = 
}
