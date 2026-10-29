import { describe, expect, test } from 'vitest'
import { getCreateLookupNotices } from './get-create-lookup-notices'

describe('getCreateLookupNotices', () => {
  test('returns the household sentence and no catalog sentence when the catalog hits', () => {
    expect(getCreateLookupNotices('found')).toEqual({
      householdMissMessage: 'The item was not found in our database.',
      catalogMissMessage: null,
    })
  })

  test('returns the household sentence and a prompt to enter the item name when the catalog status is empty', () => {
    expect(getCreateLookupNotices('empty')).toEqual({
      householdMissMessage: 'The item was not found in our database.',
      catalogMissMessage: 'Enter the item name manually.',
    })
  })
})
