import { DB_FUNCTION_RENAME_HOUSEHOLD_CATEGORY } from '../db/entities'

const UNIQUE_VIOLATION_ERROR_CODE = '23505'
const NO_DATA_FOUND_ERROR_CODE = 'P0002'

interface RenameHouseholdCategoryClient {
  rpc(
    functionName: typeof DB_FUNCTION_RENAME_HOUSEHOLD_CATEGORY,
    args: { target_category_id: string; new_name: string },
  ): PromiseLike<{
    data: unknown
    error: { message: string; code?: string } | null
  }>
}

interface RenameHabUnitCategoryInput {
  readonly categoryId: string
  readonly name: string
}

interface RenamedHabUnitCategory {
  readonly status: 'renamed'
}

interface DuplicateHabUnitCategoryName {
  readonly status: 'duplicate'
}

interface MissingHabUnitCategory {
  readonly status: 'missing'
}

type RenameHabUnitCategoryResult =
  | RenamedHabUnitCategory
  | DuplicateHabUnitCategoryName
  | MissingHabUnitCategory

const renameHabUnitCategory = async (
  { categoryId, name }: RenameHabUnitCategoryInput,
  client: RenameHouseholdCategoryClient,
): Promise<RenameHabUnitCategoryResult> => {
  const { error } = await client.rpc(DB_FUNCTION_RENAME_HOUSEHOLD_CATEGORY, {
    target_category_id: categoryId,
    new_name: name,
  })

  if (error?.code === UNIQUE_VIOLATION_ERROR_CODE) {
    return { status: 'duplicate' }
  }

  if (error?.code === NO_DATA_FOUND_ERROR_CODE) {
    return { status: 'missing' }
  }

  if (error) {
    throw new Error(
      `rename_household_category failed for category ${categoryId} and name ${name}`,
      { cause: error },
    )
  }

  return { status: 'renamed' }
}

export { renameHabUnitCategory }
export type { RenameHouseholdCategoryClient, RenameHabUnitCategoryResult }
