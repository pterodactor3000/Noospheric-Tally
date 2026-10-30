import { describe, expect, test } from 'vitest'

import { getBarcodeLineText } from './get-barcode-line-text'

describe('getBarcodeLineText', () => {
  test('returns the redacted text when there are no barcodes and the line is not revealed', () => {
    expect(getBarcodeLineText([], false)).toEqual(' ++  [REDACTED] ++')
  })

  test('returns the no barcode supplied phrase when there are no barcodes and the line is revealed', () => {
    expect(getBarcodeLineText([], true)).toEqual('// NO BARCODE SUPPLIED //')
  })

  test('returns one barcode inside the decoration', () => {
    expect(getBarcodeLineText(['5901234123457'], false)).toEqual(
      ' ++  5901234123457 ++',
    )
  })

  test('returns several barcodes joined with a comma and a space', () => {
    expect(getBarcodeLineText(['11111111', '22222222'], false)).toEqual(
      ' ++  11111111, 22222222 ++',
    )
  })

  test('keeps the barcodes when the line is marked revealed', () => {
    expect(getBarcodeLineText(['11111111', '22222222'], true)).toEqual(
      ' ++  11111111, 22222222 ++',
    )
  })

  test('keeps the leading space and the double space before the value', () => {
    expect(getBarcodeLineText(['11111111'], false).startsWith(' ++  ')).toEqual(
      true,
    )
    expect(getBarcodeLineText([], false).startsWith(' ++  ')).toEqual(true)
  })
})
