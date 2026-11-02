'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import {
  fieldStack,
  formStack,
  pageTitle,
  sectionCopy,
} from '@/app/styles/class-names'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormAlert } from '@/components/ui/form-alert'
import { buildHabUnitInviteUrl } from '@/lib/hab-unit/build-hab-unit-invite-url'

import { createHabUnitInvite } from '../actions'

type ShareHabUnitFormState = Awaited<
  ReturnType<typeof createHabUnitInvite>
> | null

const ShareHabUnitForm = () => {
  const [state, formAction, isPending] = useActionState(
    async (): Promise<ShareHabUnitFormState> => {
      try {
        return await createHabUnitInvite()
      } catch (error: unknown) {
        console.error('Create hab-unit invite failed.', { error })
        return {
          status: 'error',
          kind: 'failure',
          message: 'Invite code creation failed. Try again.',
        }
      }
    },
    null,
  )

  return (
    <>
      <h1 className={pageTitle}>Share hab unit</h1>

      <form action={formAction} className={formStack}>
        <FormAlert message={state?.status === 'error' ? state.message : null}>
          <Button
            variant="outline"
            type="submit"
            disabled={isPending}
            size="touch"
          >
            Generate invite code
          </Button>
        </FormAlert>

        {state?.status === 'created' ? (
          <>
            <div className={fieldStack}>
              <Label htmlFor="generated-invite-code">
                Invite code
              </Label>
              <Input
                type="text"
                id="generated-invite-code"
                readOnly
                value={state.inviteCode}
              />
            </div>
            <div className={fieldStack}>
              <Label htmlFor="invite-link">
                Invite link
              </Label>
              <Input
                type="text"
                id="invite-link"
                readOnly
                value={buildHabUnitInviteUrl(
                  window.location.origin,
                  state.inviteCode,
                )}
              />
            </div>
            <p className={sectionCopy}>Expires {state.expiresAt}</p>
            <p className={sectionCopy}>
              The code works once, expires in 7 days, and replaces any earlier
              unused code.
            </p>
          </>
        ) : null}
      </form>
    </>
  )
}

export default ShareHabUnitForm
