import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

import { HELP_TOPICS } from './help-topics'

const HELP_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../public/help',
)
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const SCREENSHOT_NAME = /^help-(\d{2})-[a-z-]+\.png$/

const KEBAB_CASE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const TYPED_DECREASE = `${'['}-${']'}`
const TYPED_INCREASE = `${'['}+${']'}`

const joinTopicParagraphs = (topicId: string): string => {
  const topic = HELP_TOPICS.find((entry) => entry.id === topicId)
  if (!topic) {
    throw new Error(`joinTopicParagraphs failed for topic ${topicId}`)
  }

  return topic.paragraphs.join(' ')
}

describe('HELP_TOPICS', () => {
  test('returns the topic ids in the confirmed order', () => {
    expect(HELP_TOPICS.map((topic) => topic.id)).toEqual([
      'hab-unit-creation',
      'tally-list',
      'search-sort-categories',
      'add-items',
      'unknown-barcode-and-attach',
      'scanner',
      'scan-popups',
      'restock',
      'lookup',
      'item-details',
      'share-hab-unit',
    ])
  })

  test('returns unique, lowercase kebab-case ids', () => {
    const ids = HELP_TOPICS.map((topic) => topic.id)

    expect(new Set(ids).size).toEqual(ids.length)
    expect(ids.every((id) => KEBAB_CASE_ID.test(id))).toEqual(true)
  })

  test('returns a non-empty title and at least one non-empty paragraph for every topic', () => {
    expect(
      HELP_TOPICS.every(
        (topic) =>
          topic.title.length > 0 &&
          topic.paragraphs.length > 0 &&
          topic.paragraphs.every((paragraph) => paragraph.length > 0),
      ),
    ).toEqual(true)
  })

  test('names consume and tally in the scanner topic', () => {
    const text = joinTopicParagraphs('scanner')

    expect(text.includes('consume')).toEqual(true)
    expect(text.includes('tally')).toEqual(true)
  })

  test('names [0 short], CRITICAL, and minimum in the restock topic', () => {
    const text = joinTopicParagraphs('restock')

    expect(text.includes('[0 short]')).toEqual(true)
    expect(text.includes('CRITICAL')).toEqual(true)
    expect(text.includes('minimum')).toEqual(true)
  })

  test('names Not in your hab unit. in the lookup topic', () => {
    expect(joinTopicParagraphs('lookup').includes('Not in your hab unit.')).toEqual(
      true,
    )
  })

  test('names Generate invite code and 7 days in the sharing topic', () => {
    const text = joinTopicParagraphs('share-hab-unit')

    expect(text.includes('Generate invite code')).toEqual(true)
    expect(text.includes('7 days')).toEqual(true)
  })

  test('names Count, Minimum, Category, and Use in the item details topic', () => {
    const text = joinTopicParagraphs('item-details')

    expect(text.includes('Count')).toEqual(true)
    expect(text.includes('Minimum')).toEqual(true)
    expect(text.includes('Category')).toEqual(true)
    expect(text.includes('Use')).toEqual(true)
  })

  test('names the - button and the + button in the tally topic', () => {
    const text = joinTopicParagraphs('tally-list')

    expect(text.includes('[<hab unit name>] tally')).toEqual(true)
    expect(
      text.includes(
        'Each row shows the name, a dot leader, the - button, the count, and the + button.',
      ),
    ).toEqual(true)
    expect(
      text.includes(
        'The - button lowers the count by 1. The + button raises it by 1. The tally saves that change at once. The - button is disabled at 0. The + button is disabled at 99.',
      ),
    ).toEqual(true)
    expect(text.includes(TYPED_DECREASE)).toEqual(false)
    expect(text.includes(TYPED_INCREASE)).toEqual(false)
  })

  test('names the - button and the + button in the item details topic', () => {
    const text = joinTopicParagraphs('item-details')

    expect(
      text.includes('The - button, the + button, and the category list'),
    ).toEqual(true)
    expect(text.includes(TYPED_DECREASE)).toEqual(false)
    expect(text.includes(TYPED_INCREASE)).toEqual(false)
  })

  test('maps each topic to its screenshot file names', () => {
    expect(
      HELP_TOPICS.map((topic) => [
        topic.id,
        topic.screenshots.map((image) => image.fileName),
      ]),
    ).toEqual([
      ['hab-unit-creation', ['help-01-hab-unit.png']],
      ['tally-list', ['help-02-tally.png']],
      ['search-sort-categories', ['help-03-search-sort.png']],
      ['add-items', ['help-04-add-item.png']],
      ['unknown-barcode-and-attach', [
        'help-05-unknown-barcode.png',
        'help-05-attach-existing.png',
      ]],
      ['scanner', ['help-06-scanner.png']],
      ['scan-popups', ['help-07-popup-tally.png', 'help-07-popup-consume.png']],
      ['restock', ['help-08-restock.png']],
      ['lookup', ['help-09-lookup-found.png', 'help-09-lookup-missing.png']],
      ['item-details', ['help-10-item-details.png']],
      ['share-hab-unit', ['help-11-share.png']],
    ])
  })

  test('stores every referenced png and no extra help png', () => {
    const referenced = HELP_TOPICS.flatMap((topic) =>
      topic.screenshots.map((image) => image.fileName),
    )
    const stored = readdirSync(HELP_DIR)
      .filter((fileName) => fileName.endsWith('.png'))
      .sort()

    expect(stored).toEqual([...referenced].sort())
  })

  test('matches each png signature and declared size', () => {
    const images = HELP_TOPICS.flatMap((topic) => topic.screenshots)

    expect(
      images.map((image) => {
        const bytes = readFileSync(path.join(HELP_DIR, image.fileName))
        const signature = PNG_SIGNATURE.every(
          (byte, index) => bytes[index] === byte,
        )
        return {
          fileName: image.fileName,
          signature,
          width: bytes.readUInt32BE(16),
          height: bytes.readUInt32BE(20),
        }
      }),
    ).toEqual(
      images.map((image) => ({
        fileName: image.fileName,
        signature: true,
        width: image.width,
        height: image.height,
      })),
    )
  })

  test('uses one pixel width, a topic number, and a non-empty alt', () => {
    const images = HELP_TOPICS.flatMap((topic, index) =>
      topic.screenshots.map((image) => ({
        fileName: image.fileName,
        topicNumber: String(index + 1).padStart(2, '0'),
        alt: image.alt,
        width: image.width,
      })),
    )
    const widths = new Set(images.map((image) => image.width))

    expect(widths.size).toEqual(1)
    expect(
      images.every((image) => {
        const match = SCREENSHOT_NAME.exec(image.fileName)
        return (
          match !== null &&
          match[1] === image.topicNumber &&
          image.alt.length > 0
        )
      }),
    ).toEqual(true)
  })
})
