import { describe, expect, test } from 'vitest'
import { parseBulkItemsFile } from './parse-bulk-items-file'

const FILE_MUST_BE_ARRAY = {
  status: 'invalid',
  message: 'The file must be a JSON array of items.',
}

const NAME_RESTRICTION = 'Item does not match length restrictions'
const BARCODE_RESTRICTION = 'Barcode does not match restrictions'

const getGtinCheckDigit = (dataDigits: string): string => {
  let sum = 0

  for (let index = 0; index < dataDigits.length; ++index) {
    const digit = Number(dataDigits[index])
    const weight = (dataDigits.length - 1 - index) % 2 === 0 ? 3 : 1
    sum += digit * weight
  }

  return String((10 - (sum % 10)) % 10)
}

const buildGtin13 = (counter: number): string => {
  const dataDigits = String(counter).padStart(12, '0')
  return `${dataDigits}${getGtinCheckDigit(dataDigits)}`
}

describe('parseBulkItemsFile', () => {
  test('returns the entries with trimmed names and normalized barcodes for a valid file', () => {
    expect(
      parseBulkItemsFile([
        { name: '  Wet food  ', barcode: '  3017620422003  ' },
        { name: 'Kibble', barcode: '425261' },
      ]),
    ).toEqual({
      status: 'valid',
      entries: [
        { name: 'Wet food', barcode: '3017620422003' },
        { name: 'Kibble', barcode: '042100005264' },
      ],
    })
  })

  test('ignores a category key and any other extra key', () => {
    const file = [
      {
        name: '  Wet food  ',
        barcode: '3017620422003',
        category: 'food',
        note: 'ignore me',
      },
    ]

    expect(parseBulkItemsFile(file)).toEqual({
      status: 'valid',
      entries: [{ name: 'Wet food', barcode: '3017620422003' }],
    })
    expect(file).toEqual([
      {
        name: '  Wet food  ',
        barcode: '3017620422003',
        category: 'food',
        note: 'ignore me',
      },
    ])
  })

  test('returns an invalid result when the array is empty', () => {
    expect(parseBulkItemsFile([])).toEqual({
      status: 'invalid',
      message: 'The file has no items.',
    })
  })

  test('returns an invalid result when the value is null', () => {
    expect(parseBulkItemsFile(null)).toEqual(FILE_MUST_BE_ARRAY)
  })

  test('returns an invalid result when the value is a string', () => {
    expect(parseBulkItemsFile('[]')).toEqual(FILE_MUST_BE_ARRAY)
  })

  test('returns an invalid result when the value is a number', () => {
    expect(parseBulkItemsFile(0)).toEqual(FILE_MUST_BE_ARRAY)
  })

  test('returns an invalid result when the value is a plain object', () => {
    expect(
      parseBulkItemsFile({ name: 'Wet food', barcode: '3017620422003' }),
    ).toEqual(FILE_MUST_BE_ARRAY)
  })

  test('returns an invalid result when an entry is null', () => {
    expect(
      parseBulkItemsFile([
        { name: 'Wet food', barcode: '3017620422003' },
        null,
      ]),
    ).toEqual({
      status: 'invalid',
      message: 'entries[1] must be an object with a name and a barcode.',
    })
  })

  test('returns an invalid result when an entry is an array', () => {
    expect(parseBulkItemsFile([['Wet food', '3017620422003']])).toEqual({
      status: 'invalid',
      message: 'entries[0] must be an object with a name and a barcode.',
    })
  })

  test('returns an invalid result when an entry is a string', () => {
    expect(parseBulkItemsFile(['Wet food'])).toEqual({
      status: 'invalid',
      message: 'entries[0] must be an object with a name and a barcode.',
    })
  })

  test('returns an invalid result when an entry name is missing', () => {
    expect(parseBulkItemsFile([{ barcode: '3017620422003' }])).toEqual({
      status: 'invalid',
      message: 'entries[0] (barcode 3017620422003) needs a text name.',
    })
  })

  test('returns an invalid result when an entry name is not a string', () => {
    expect(
      parseBulkItemsFile([{ name: 1, barcode: '3017620422003' }]),
    ).toEqual({
      status: 'invalid',
      message: 'entries[0] (barcode 3017620422003) needs a text name.',
    })
  })

  test('returns an invalid result when an entry barcode is missing', () => {
    expect(parseBulkItemsFile([{ name: 'Wet food' }])).toEqual({
      status: 'invalid',
      message: 'entries[0] needs a text barcode.',
    })
  })

  test('returns an invalid result when an entry barcode is not a string', () => {
    expect(parseBulkItemsFile([{ name: 'Wet food', barcode: 12 }])).toEqual({
      status: 'invalid',
      message: 'entries[0] needs a text barcode.',
    })
  })

  test('returns an invalid result when an entry name is blank', () => {
    expect(
      parseBulkItemsFile([{ name: '   ', barcode: '3017620422003' }]),
    ).toEqual({
      status: 'invalid',
      message: `entries[0] (barcode 3017620422003): ${NAME_RESTRICTION}`,
    })
  })

  test('returns an invalid result when an entry name is over 120 characters', () => {
    expect(
      parseBulkItemsFile([
        { name: 'a'.repeat(121), barcode: '3017620422003' },
      ]),
    ).toEqual({
      status: 'invalid',
      message: `entries[0] (barcode 3017620422003): ${NAME_RESTRICTION}`,
    })
  })

  test('returns an invalid result when an entry barcode is invalid', () => {
    expect(
      parseBulkItemsFile([{ name: 'Wet food', barcode: '3017620422004' }]),
    ).toEqual({
      status: 'invalid',
      message: `entries[0] (barcode 3017620422004): ${BARCODE_RESTRICTION}`,
    })
  })

  test('cuts a very long barcode to 20 characters in the message', () => {
    expect(
      parseBulkItemsFile([
        {
          name: 'Wet food',
          barcode: '1234567890123456789012345',
        },
      ]),
    ).toEqual({
      status: 'invalid',
      message: `entries[0] (barcode 12345678901234567890): ${BARCODE_RESTRICTION}`,
    })
  })

  test('returns an invalid result when a barcode is repeated', () => {
    expect(
      parseBulkItemsFile([
        { name: 'Wet food', barcode: '3017620422003' },
        { name: 'Dry food', barcode: '3017620422003' },
      ]),
    ).toEqual({
      status: 'invalid',
      message:
        'entries[1] repeats the barcode 3017620422003 from entries[0].',
    })
  })

  test('returns an invalid result when a barcode matches an earlier one only after normalization', () => {
    expect(
      parseBulkItemsFile([
        { name: 'Wet food', barcode: '3017620422003' },
        { name: 'Dry food', barcode: '  3017620422003  ' },
      ]),
    ).toEqual({
      status: 'invalid',
      message:
        'entries[1] repeats the barcode 3017620422003 from entries[0].',
    })
  })

  test('returns an invalid result for the first bad entry when several entries are bad', () => {
    expect(
      parseBulkItemsFile([
        { name: '   ', barcode: '3017620422003' },
        { name: 'Dry food', barcode: 'not-a-barcode' },
        null,
      ]),
    ).toEqual({
      status: 'invalid',
      message: `entries[0] (barcode 3017620422003): ${NAME_RESTRICTION}`,
    })
  })

  test('returns a valid result when the file has exactly 500 entries', () => {
    const entries = Array.from({ length: 500 }, (_, index) => ({
      name: `Item ${index + 1}`,
      barcode: buildGtin13(index + 1),
    }))

    expect(parseBulkItemsFile(entries)).toEqual({
      status: 'valid',
      entries,
    })
  })

  test('returns an invalid result when the file has 501 entries', () => {
    expect(parseBulkItemsFile(Array.from({ length: 501 }, () => null))).toEqual(
      {
        status: 'invalid',
        message: 'The file has 501 items. The limit is 500.',
      },
    )
  })
})
