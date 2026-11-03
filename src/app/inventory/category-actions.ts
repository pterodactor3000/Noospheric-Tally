'use server'

import { revalidatePath } from 'next/cache'

import { createHabUnitCategory } from '@/lib/items/create-hab-unit-category'
import { ITEM_WRITE_FAILURE_MESSAGE } from '@/lib/items/scan-failure-messages'
import { validateCategoryName } from '@/lib/items/validate-category-name'
import { createClient } from '@/lib/supabase/server'

interface CategoryActionError {
  readonly status: 'error'
  readonly message: string
  readonly field?: 'name'
}

interface CategorySaved {
  readonly status: 'saved'
}

type CreateCategoryResult = CategorySaved | CategoryActionError

const DUPLICATE_CATEGORY_NAME_MESSAGE =
  'A category with this name already exists.'

const getFormString = (formData: FormData, key: string): string => {
  const value = formData.get(key)
  return typeof value === 'string' ? value : ''
}

const createCategory = async (
  formData: FormData,
): Promise<CreateCategoryResult> => {
  const nameResult = validateCategoryName(getFormString(formData, 'name'))
  if (nameResult.status === 'invalid') {
    return { status: 'error', message: nameResult.message, field: 'name' }
  }

  try {
    const supabase = await createClient()
    const result = await createHabUnitCategory(nameResult.name, supabase)
    if (result.status === 'duplicate') {
      return {
        status: 'error',
        message: DUPLICATE_CATEGORY_NAME_MESSAGE,
        field: 'name',
      }
    }

    revalidatePath('/inventory')
    revalidatePath('/inventory/restock')
  } catch (error: unknown) {
    console.error('createCategory failed', {
      name: nameResult.name,
      error,
    })
    return { status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }
  }

  return { status: 'saved' }
}

export { createCategory }
export type { CreateCategoryResult }
