const NO_BARCODE_SUPPLIED_TEXT = '// NO BARCODE SUPPLIED //'

const getBarcodeLineText = (
  barcodes: readonly string[],
  isRevealed: boolean,
): string => {
  if (barcodes.length > 0) {
    return ` ++  ${barcodes.join(', ')} ++`
  }

  if (isRevealed) {
    return NO_BARCODE_SUPPLIED_TEXT
  }

  return ' ++  [REDACTED] ++'
}

export { getBarcodeLineText, NO_BARCODE_SUPPLIED_TEXT }
