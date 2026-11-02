import { describe, expect, test } from 'vitest'

import { HELP_TOPICS } from './help-topics'

const KEBAB_CASE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const joinTopicParagraphs = (topicId: string): string => {
  const topic = HELP_TOPICS.find((entry) => entry.id === topicId)
  if (!topic) {
    throw new Error(`joinTopicParagraphs failed for topic ${topicId}`)
  }

  return topic.paragraphs.join(' ')
}

describe('HELP_TOPICS', () => {
  test('returns the ten topic ids in the confirmed order', () => {
    expect(HELP_TOPICS.map((topic) => topic.id)).toEqual([
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
})
