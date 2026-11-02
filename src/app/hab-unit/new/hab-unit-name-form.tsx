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

import { createHabUnit } from '../actions'

interface HabUnitNameFormProps {
  defaultName: string
}

type HabUnitFormState = Awaited<ReturnType<typeof createHabUnit>> | null

const HabUnitNameForm = ({ defaultName }: HabUnitNameFormProps) => {
  const [state, formAction, isPending] = useActionState(
    async (_prev: HabUnitFormState, formData: FormData) =>
      createHabUnit(formData),
    null,
  )
  const isNameError =
    state?.status === 'error' &&
    state.kind === 'field' &&
    state.field === 'name'

  return (
    <>
      <h2 className={sectionHeading}>Create hab-unit</h2>
      <p className={sectionCopy}>
        You can create your own hab-unit tally. You can share it later.
      </p>

      <form
        action={formAction}
        className={formStack}
      >
        <div className={fieldStack}>
          <Label htmlFor="name">
            Hab-unit designation
          </Label>
          <Input
            type="text"
            name="name"
            id="name"
            autoComplete="name"
            defaultValue={defaultName}
            aria-invalid={isNameError}
          />
        </div>
        <FormAlert message={state?.status === 'error' ? state.message : null}>
          <Button
            variant="outline"
            type="submit"
            disabled={isPending}
            size="touch"
          >
            Apply
          </Button>
        </FormAlert>
      </form>
    </>
  )
}

export default HabUnitNameForm
