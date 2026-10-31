'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import {
  fieldControl,
  fieldLabel,
  fieldStack,
  formStack,
  fullWidthButton,
  sectionHeading,
} from '@/app/styles/class-names'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormAlert } from '@/components/form-alert'

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

  return (
    <>
      <h2 className={sectionHeading}>Join hab unit</h2>

      <form action={formAction} className={formStack}>
        <div className={fieldStack}>
          <Label htmlFor="invite-code" className={fieldLabel}>
            Invite code
          </Label>
          <Input
            type="text"
            name="code"
            id="invite-code"
            autoComplete="off"
            defaultValue={defaultCode}
            aria-invalid={state?.field === 'code'}
            className={fieldControl}
          />
        </div>
        <FormAlert message={state?.status === 'error' ? state.message : null}>
          <Button
            variant="outline"
            type="submit"
            disabled={isPending}
            className={fullWidthButton}
          >
            Join
          </Button>
        </FormAlert>
      </form>
    </>
  )
}

export default JoinHabUnitForm
