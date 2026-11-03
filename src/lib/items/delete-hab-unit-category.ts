import { DB_FUNCTION_DELETE_HOUSEHOLD_CATEGORY } from '../db/entities'

const NO_DATA_FOUND_ERROR_CODE = 'P0002'

interface DeleteHouseholdCategoryClient {
  rpc(
    functionName: typeof DB_FUNCTION_DELETE_HOUSEHOLD_CATEGORY,
    args: { target_category_id: string },
  ): PromiseLike<{
    data: unknown
    error: { message: string; code?: string } | null
  }>
}

interface DeletedHabUnitCategory {
  readonly status: 'deleted'
}

interface MissingHabUnitCategory {
  readonly status: 'missing'
}

type DeleteHabUnitCategoryResult =
  | DeletedHabUnitCategory
  | MissingHabUnitCategory

const deleteHabUnitCategory = async (
  categoryId: string,
  client: DeleteHouseholdCategoryClient,
): Promise<DeleteHabUnitCategoryResult> => {
  const { error } = await client.rpc(DB_FUNCTION_DELETE_HOUSEHOLD_CATEGORY, {
    target_category_id: categoryId,
  })

  if (error?.code === NO_DATA_FOUND_ERROR_CODE) {
    return { status: 'missing' }
  }

  if (error) {
    throw new Error(
      `delete_household_category failed for category ${categoryId}`,
      { cause: error },
    )
  }

  return { status: 'deleted' }
}

export { deleteHabUnitCategory }
export type { DeleteHouseholdCategoryClient, DeleteHabUnitCategoryResult }
