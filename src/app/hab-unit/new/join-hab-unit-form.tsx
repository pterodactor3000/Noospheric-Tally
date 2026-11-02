'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import {
  fieldStack,
  formStack,
  sectionCopy,
  sectionHeading,
} from '@/app/styles/class-names'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormAlert } from '@/components/ui/form-alert'

import { joinHabUnit } from '../actions'

interface JoinHabUnitFormProps {
  defaultCode: string
}

type JoinHabUnitFormState = Awaited<ReturnType<typeof joinHabUnit>> | null

const JoinHabUnitForm = ({ defaultCode }: JoinHabUnitFormProps) => {
  const [state, formAction, isPending] = useActionState(
    async (_previous: JoinHabUnitFormState, formData: FormData) =>
      joinHabUnit(formData),
    null,
  )
  const isCodeError =
    state?.status === 'error' &&
    state.kind === 'field' &&
    state.field === 'code'

  return (
    <>
      <h2 className={sectionHeading}>Join hab-unit</h2>
      <p className={sectionCopy}>
        If you received an invite code, you can join an existing hab-unit
        here.
      </p>

      <form action={formAction} className={formStack}>
        <div className={fieldStack}>
          <Label htmlFor="invite-code">
            Invite code
          </Label>
          <Input
            type="text"
            name="code"
            id="invite-code"
            autoComplete="off"
            defaultValue={defaultCode}
            aria-invalid={isCodeError}
            aria-errormessage={isCodeError ? 'invite-code-error' : undefined}
          />
        </div>
        <FormAlert
          id="invite-code-error"
          message={state?.status === 'error' ? state.message : null}
        >
          <Button
            variant="outline"
            type="submit"
            disabled={isPending}
            size="touch"
          >
            Join
          </Button>
        </FormAlert>
      </form>
    </>
  )
}

export default JoinHabUnitForm
