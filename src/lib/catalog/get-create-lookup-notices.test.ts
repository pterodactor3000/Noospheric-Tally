import { describe, expect, test } from 'vitest'
import { getCreateLookupNotices } from './get-create-lookup-notices'

describe('getCreateLookupNotices', () => {
  test('returns the household sentence and no catalog sentence when the catalog hits', () => {
    expect(getCreateLookupNotices('found')).toEqual({
      householdMissMessage: 'The item was not found in our database.',
      catalogMissMessage: null,
    })
  })

  test('returns the household sentence and the catalog sentence when every catalog misses', () => {
    expect(getCreateLookupNotices('empty')).toEqual({
      householdMissMessage: 'The item was not found in our database.',
      catalogMissMessage: 'The item was not found in the external databases.',
    })
  })
})
