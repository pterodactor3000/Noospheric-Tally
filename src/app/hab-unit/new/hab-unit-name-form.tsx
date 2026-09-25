'use client'

import { useActionState } from 'react'
import { clsx } from 'clsx'

import { Button } from '@/components/ui/button'
import {
  fieldControl,
  fieldLabel,
  fieldStack,
  formError,
  formStack,
  fullWidthButton,
  pageLead,
  pageTitle,
} from '@/app/styles/class-names'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createHabUnit } from '../actions'

interface HabUnitNameFormProps {
  defaultName: string
}

type HabUnitFormState = {
  status: 'error' | 'success' | 'pending'
  message: string
  field?: 'name'
} | null

const HabUnitNameForm = ({ defaultName }: HabUnitNameFormProps) => {
  const [state, formAction, isPending] = useActionState(
    async (_prev: HabUnitFormState, formData: FormData) =>
      createHabUnit(formData),
    null,
  )

  return (
    <>
      <h1 className={pageTitle}>
        Hab-unit data creation
      </h1>
      <p className={clsx(pageLead, 'uppercase')}>
        Provide your hab-unit designation
      </p>

      <form
        action={formAction}
        className={formStack}
      >
        <div className={fieldStack}>
          <Label
            htmlFor="name"
            className={clsx(fieldLabel, 'uppercase')}
          >
            Hab-unit designation
          </Label>
          <Input
            type="text"
            name="name"
            id="name"
            autoComplete="name"
            defaultValue={defaultName}
            aria-invalid={state?.field === 'name'}
            className={clsx(fieldControl, 'uppercase')}
          />
        </div>
        <div
          role="alert"
          aria-live="polite"
          className={clsx(formError, 'uppercase')}
        >
          {state?.status === 'error' && state?.message}
        </div>

        <Button
          variant="outline"
          type="submit"
          disabled={isPending}
          className={clsx(fullWidthButton, 'uppercase')}
        >
          Apply
        </Button>
      </form>
    </>
  )
}

export default HabUnitNameForm
