import { describe, expect, test } from 'vitest'

import { readItemBarcodes } from './load-item-barcodes'

describe('readItemBarcodes', () => {
  test('returns every barcode in row order', () => {
    expect(
      readItemBarcodes([{ barcode: '11111111' }, { barcode: '22222222' }]),
    ).toEqual(['11111111', '22222222'])
  })

  test('returns an empty array for an empty row list', () => {
    expect(readItemBarcodes([])).toEqual([])
  })

  test('returns null when a row has no barcode', () => {
    expect(readItemBarcodes([{}])).toEqual(null)
  })

  test('returns null when a barcode is not a string', () => {
    expect(readItemBarcodes([{ barcode: 11111111 }])).toEqual(null)
  })

  test('returns null when the rows are not an array', () => {
    expect(readItemBarcodes(null)).toEqual(null)
    expect(readItemBarcodes({ barcode: '11111111' })).toEqual(null)
  })
})
