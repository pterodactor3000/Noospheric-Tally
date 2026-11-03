import { DB_FUNCTION_CREATE_HOUSEHOLD_CATEGORY } from '../db/entities'

const UNIQUE_VIOLATION_ERROR_CODE = '23505'

interface CreateHouseholdCategoryClient {
  rpc(
    functionName: typeof DB_FUNCTION_CREATE_HOUSEHOLD_CATEGORY,
    args: { category_name: string },
  ): PromiseLike<{
    data: unknown
    error: { message: string; code?: string } | null
  }>
}

interface CreatedHabUnitCategory {
  readonly status: 'created'
  readonly categoryId: string
}

interface DuplicateHabUnitCategory {
  readonly status: 'duplicate'
}

type CreateHabUnitCategoryResult =
  | CreatedHabUnitCategory
  | DuplicateHabUnitCategory

const createHabUnitCategory = async (
  name: string,
  client: CreateHouseholdCategoryClient,
): Promise<CreateHabUnitCategoryResult> => {
  const { data, error } = await client.rpc(
    DB_FUNCTION_CREATE_HOUSEHOLD_CATEGORY,
    { category_name: name },
  )

  if (error?.code === UNIQUE_VIOLATION_ERROR_CODE) {
    return { status: 'duplicate' }
  }

  if (error || typeof data !== 'string') {
    throw new Error(
      `create_household_category failed for name ${name}`,
      error ? { cause: error } : undefined,
    )
  }

  return { status: 'created', categoryId: data }
}

export { createHabUnitCategory }
export type { CreateHouseholdCategoryClient, CreateHabUnitCategoryResult }
