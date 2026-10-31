'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import {
  fieldControl,
  fieldLabel,
  fieldStack,
  formStack,
  fullWidthButton,
  pageLead,
  pageTitle,
} from '@/app/styles/class-names'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormAlert } from '@/components/form-alert'

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
      <h1 className={pageTitle}>
        Hab-unit data creation
      </h1>
      <p className={pageLead}>
        Provide your hab-unit designation
      </p>

      <form
        action={formAction}
        className={formStack}
      >
        <div className={fieldStack}>
          <Label
            htmlFor="name"
            className={fieldLabel}
          >
            Hab-unit designation
          </Label>
          <Input
            type="text"
            name="name"
            id="name"
            autoComplete="name"
            defaultValue={defaultName}
            aria-invalid={isNameError}
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
            Apply
          </Button>
        </FormAlert>
      </form>
    </>
  )
}

export default HabUnitNameForm
