'use server'

import { redirect } from 'next/navigation'

import {
  HabUnitNameValidationResult,
  validateHabUnitName,
} from '@/lib/hab-unit/validate-hab-unit-name'
import { createClient } from '@/lib/supabase/server'

interface HabUnitActionError {
  status: 'error'
  message: string
  field?: 'name'
}

const CREATE_HAB_UNIT_FAILURE_MESSAGE =
  'Hab-unit data creation failed. Purify the Machine Spirit and try again.'

const createHabUnit = async (
  formData: FormData,
): Promise<HabUnitActionError> => {
  const rawHabUnitName = formData.get('name')
  const validationResult: HabUnitNameValidationResult = validateHabUnitName(
    typeof rawHabUnitName === 'string' ? rawHabUnitName : '',
  )

  if (validationResult.status === 'invalid') {
    return {
      status: 'error',
      message: validationResult.message,
      field: 'name',
    }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.rpc('create_household', {
      household_name: validationResult.name,
    })

    if (error) {
      console.error('Prayer of RPC failed. Could not create hab-unit data.', {
        habUnitName: validationResult.name,
        error,
      })

      return {
        status: 'error',
        message: CREATE_HAB_UNIT_FAILURE_MESSAGE,
      }
    }
  } catch (error: unknown) {
    console.error('Create hab-unit data function failed.', {
      habUnitName: validationResult.name,
      error,
    })
    return {
      status: 'error',
      message: CREATE_HAB_UNIT_FAILURE_MESSAGE,
    }
  }
  redirect('/inventory')
}

export { createHabUnit }
