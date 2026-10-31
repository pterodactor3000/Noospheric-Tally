import { validateBarcode } from './validate-barcode'
import { validateItemName } from './validate-item-name'

interface BulkItemEntry {
  readonly name: string
  readonly barcode: string
}

interface ValidBulkItems {
  readonly status: 'valid'
  readonly entries: readonly BulkItemEntry[]
}

interface InvalidBulkItems {
  readonly status: 'invalid'
  readonly message: string
}

type BulkItemsParseResult = ValidBulkItems | InvalidBulkItems

const BULK_ITEMS_MAX_ENTRIES = 500
const BARCODE_PREFIX_LENGTH = 20

const FILE_MUST_BE_ARRAY = 'The file must be a JSON array of items.'
const FILE_HAS_NO_ITEMS = 'The file has no items.'

const isUnknownArray = (value: unknown): value is readonly unknown[] =>
  Array.isArray(value)

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const getEntryLabel = (index: number): string => `entries[${index}]`

const getEntryPrefix = (
  index: number,
  entry: Record<string, unknown>,
): string => {
  const label = getEntryLabel(index)

  if (typeof entry.barcode !== 'string') {
    return label
  }

  return `${label} (barcode ${entry.barcode.slice(0, BARCODE_PREFIX_LENGTH)})`
}

const invalidResult = (message: string): InvalidBulkItems => ({
  status: 'invalid',
  message,
})

const parseBulkItemsFile = (value: unknown): BulkItemsParseResult => {
  if (!isUnknownArray(value)) {
    return invalidResult(FILE_MUST_BE_ARRAY)
  }

  if (value.length === 0) {
    return invalidResult(FILE_HAS_NO_ITEMS)
  }

  if (value.length > BULK_ITEMS_MAX_ENTRIES) {
    return invalidResult(
      `The file has ${value.length} items. The limit is ${BULK_ITEMS_MAX_ENTRIES}.`,
    )
  }

  const seenBarcodes = new Map<string, number>()
  const entries: BulkItemEntry[] = []

  for (let index = 0; index < value.length; ++index) {
    const entry = value[index]

    if (!isPlainObject(entry)) {
      return invalidResult(
        `${getEntryLabel(index)} must be an object with a name and a barcode.`,
      )
    }

    if (typeof entry.name !== 'string') {
      return invalidResult(`${getEntryPrefix(index, entry)} needs a text name.`)
    }

    if (typeof entry.barcode !== 'string') {
      return invalidResult(`${getEntryLabel(index)} needs a text barcode.`)
    }

    const nameResult = validateItemName(entry.name)
    if (nameResult.status === 'invalid') {
      return invalidResult(
        `${getEntryPrefix(index, entry)}: ${nameResult.message}`,
      )
    }

    const barcodeResult = validateBarcode(entry.barcode)
    if (barcodeResult.status === 'invalid') {
      return invalidResult(
        `${getEntryPrefix(index, entry)}: ${barcodeResult.message}`,
      )
    }

    const firstIndex = seenBarcodes.get(barcodeResult.barcode)
    if (firstIndex !== undefined) {
      return invalidResult(
        `${getEntryLabel(index)} repeats the barcode ${barcodeResult.barcode} from ${getEntryLabel(firstIndex)}.`,
      )
    }

    seenBarcodes.set(barcodeResult.barcode, index)
    entries.push({
      name: nameResult.name,
      barcode: barcodeResult.barcode,
    })
  }

  return {
    status: 'valid',
    entries,
  }
}

export {
  BULK_ITEMS_MAX_ENTRIES,
  parseBulkItemsFile,
  type BulkItemEntry,
  type BulkItemsParseResult,
}
