'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import {
  fieldControl,
  fieldLabel,
  fieldStack,
  formStack,
  fullWidthButton,
  pageTitle,
  sectionCopy,
} from '@/app/styles/class-names'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormAlert } from '@/components/form-alert'
import { buildHabUnitInviteUrl } from '@/lib/hab-unit/build-hab-unit-invite-url'

import { createHabUnitInvite } from '../actions'

type ShareHabUnitFormState = Awaited<
  ReturnType<typeof createHabUnitInvite>
> | null

const ShareHabUnitForm = () => {
  const [state, formAction, isPending] = useActionState(
    async (): Promise<ShareHabUnitFormState> => createHabUnitInvite(),
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
            className={fullWidthButton}
          >
            Generate invite code
          </Button>
        </FormAlert>

        {state?.status === 'created' ? (
          <>
            <div className={fieldStack}>
              <Label htmlFor="generated-invite-code" className={fieldLabel}>
                Invite code
              </Label>
              <Input
                type="text"
                id="generated-invite-code"
                readOnly
                value={state.inviteCode}
                className={fieldControl}
              />
            </div>
            <div className={fieldStack}>
              <Label htmlFor="invite-link" className={fieldLabel}>
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
                className={fieldControl}
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
