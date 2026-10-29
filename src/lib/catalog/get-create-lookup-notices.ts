interface CreateLookupNotices {
  householdMissMessage: string
  catalogMissMessage: string | null
}

const HOUSEHOLD_MISS_MESSAGE = 'The item was not found in our database.'
const CATALOG_MISS_MESSAGE = 'The item was not found in the external databases.'

const getCreateLookupNotices = (
  catalogStatus: 'found' | 'empty',
): CreateLookupNotices => ({
  householdMissMessage: HOUSEHOLD_MISS_MESSAGE,
  catalogMissMessage: catalogStatus === 'empty' ? CATALOG_MISS_MESSAGE : null,
})

export type { CreateLookupNotices }
export { getCreateLookupNotices }
