'use server'

import { revalidatePath } from 'next/cache'

import { createHabUnitCategory } from '@/lib/items/create-hab-unit-category'
import { renameHabUnitCategory } from '@/lib/items/rename-hab-unit-category'
import { isScanSessionId } from '@/lib/items/scan-session'
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

const MISSING_CATEGORY_MESSAGE =
  'That category no longer exists. Reload the page.'

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
  } catch (error: unknown) {
    console.error('createCategory failed', {
      name: nameResult.name,
      error,
    })
    return { status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }
  }

  revalidatePath('/inventory')
  revalidatePath('/inventory/restock')
  return { status: 'saved' }
}

const renameCategory = async (
  formData: FormData,
): Promise<CreateCategoryResult> => {
  const categoryId = getFormString(formData, 'categoryId')
  if (!isScanSessionId(categoryId)) {
    console.error('renameCategory rejected category id', { categoryId })
    return { status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }
  }

  const nameResult = validateCategoryName(getFormString(formData, 'name'))
  if (nameResult.status === 'invalid') {
    return { status: 'error', message: nameResult.message, field: 'name' }
  }

  try {
    const supabase = await createClient()
    const result = await renameHabUnitCategory(
      { categoryId, name: nameResult.name },
      supabase,
    )
    if (result.status === 'duplicate') {
      return {
        status: 'error',
        message: DUPLICATE_CATEGORY_NAME_MESSAGE,
        field: 'name',
      }
    }
    if (result.status === 'missing') {
      return { status: 'error', message: MISSING_CATEGORY_MESSAGE }
    }
  } catch (error: unknown) {
    console.error('renameCategory failed', {
      categoryId,
      name: nameResult.name,
      error,
    })
    return { status: 'error', message: ITEM_WRITE_FAILURE_MESSAGE }
  }

  revalidatePath('/inventory')
  revalidatePath('/inventory/restock')
  return { status: 'saved' }
}

export { createCategory, renameCategory }
export type { CreateCategoryResult }
