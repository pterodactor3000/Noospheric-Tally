interface CreateLookupNotices {
  householdMissMessage: string
  catalogMissMessage: string | null
}

const HOUSEHOLD_MISS_MESSAGE = 'The item was not found in our database.'
const EMPTY_CATALOG_MESSAGE = 'Enter the item name manually.'

const getCreateLookupNotices = (
  catalogStatus: 'found' | 'empty',
): CreateLookupNotices => ({
  householdMissMessage: HOUSEHOLD_MISS_MESSAGE,
  catalogMissMessage: catalogStatus === 'empty' ? EMPTY_CATALOG_MESSAGE : null,
})

export type { CreateLookupNotices }
export { getCreateLookupNotices }
