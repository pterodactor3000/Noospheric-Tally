'use server'

import { redirect } from 'next/navigation'

import {
  acceptHabUnitInvite,
  type HabUnitInviteRefusalReason,
} from '@/lib/hab-unit/accept-hab-unit-invite'
import { createHabUnitInvite as createHabUnitInviteRecord } from '@/lib/hab-unit/create-hab-unit-invite'
import { createNewHabUnit } from '@/lib/hab-unit/create-hab-unit'
import {
  type HabUnitInviteCodeValidationResult,
  validateHabUnitInviteCode,
} from '@/lib/hab-unit/validate-hab-unit-invite-code'
import {
  HabUnitNameValidationResult,
  validateHabUnitName,
} from '@/lib/hab-unit/validate-hab-unit-name'
import { createClient } from '@/lib/supabase/server'

interface HabUnitActionError {
  status: 'error'
  message: string
  field?: 'name' | 'code'
}

interface CreatedHabUnitInviteAction {
  status: 'created'
  inviteCode: string
  expiresAt: string
}

type CreateHabUnitInviteActionResult =
  | CreatedHabUnitInviteAction
  | HabUnitActionError

const CREATE_HAB_UNIT_FAILURE_MESSAGE =
  'Hab-unit data creation failed. Purify the Machine Spirit and try again.'

const CREATE_HAB_UNIT_INVITE_FAILURE_MESSAGE =
  'Invite code creation failed. Try again.'

const JOIN_HAB_UNIT_FAILURE_MESSAGE = 'Joining the hab unit failed. Try again.'

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
    await createNewHabUnit(validationResult.name)
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

const getJoinHabUnitRefusalMessage = (
  reason: HabUnitInviteRefusalReason,
): string => {
  switch (reason) {
    case 'malformed':
      return 'Invite code is not valid. Check it and try again.'
    case 'unknown':
      return 'Invite code was not found. Check it and try again.'
    case 'expired':
      return 'Invite code expired. Ask the member for a new one.'
    case 'used':
      return 'Invite code was already used. Ask the member for a new one.'
    case 'already-has-hab-unit':
      return 'This account already has a hab unit. Leaving a hab unit is not supported yet.'
  }
}

const createHabUnitInvite =
  async (): Promise<CreateHabUnitInviteActionResult> => {
    try {
      const client = await createClient()
      const invite = await createHabUnitInviteRecord(client)
      return {
        status: 'created',
        inviteCode: invite.inviteCode,
        expiresAt: invite.expiresAt,
      }
    } catch (error: unknown) {
      console.error('Create hab-unit invite failed.', { error })
      return {
        status: 'error',
        message: CREATE_HAB_UNIT_INVITE_FAILURE_MESSAGE,
      }
    }
  }

const joinHabUnit = async (formData: FormData): Promise<HabUnitActionError> => {
  const rawInviteCode = formData.get('code')
  const validationResult: HabUnitInviteCodeValidationResult =
    validateHabUnitInviteCode(
      typeof rawInviteCode === 'string' ? rawInviteCode : '',
    )

  if (validationResult.status === 'invalid') {
    return {
      status: 'error',
      message: validationResult.message,
      field: 'code',
    }
  }

  try {
    const client = await createClient()
    const result = await acceptHabUnitInvite(validationResult.code, client)

    if (result.status === 'refused') {
      return {
        status: 'error',
        message: getJoinHabUnitRefusalMessage(result.reason),
        field: 'code',
      }
    }
  } catch (error: unknown) {
    console.error('Join hab-unit failed.', { error })
    return {
      status: 'error',
      message: JOIN_HAB_UNIT_FAILURE_MESSAGE,
    }
  }

  redirect('/inventory')
}

export { createHabUnit, createHabUnitInvite, joinHabUnit }
