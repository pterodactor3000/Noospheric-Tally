'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { addItemToHousehold } from '../actions'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'

interface AddToHabUnitFormProps {
  itemId: string
  canonicalName: string
}

type AddToHabUnitFormState = Awaited<
  ReturnType<typeof addItemToHousehold>
> | null

const AddToHabUnitForm = ({ itemId, canonicalName }: AddToHabUnitFormProps) => {
  const [state, formAction, isPending] = useActionState(
    async (_prev: AddToHabUnitFormState, formData: FormData) =>
      addItemToHousehold(formData),
    null,
  )

  return (
    <>
      <h1 className={pageTitle}>
        Add to hab-unit
      </h1>
      <p className={pageLead}>
        Confirm or edit the item name
      </p>
      <form
        action={formAction}
        className={formStack}
      >
        <input type="hidden" name="itemId" value={itemId} />
        <div className={fieldStack}>
          <Label
            htmlFor="name"
            className={fieldLabel}
          >
            Item name
          </Label>
          <Input
            type="text"
            name="name"
            id="name"
            autoComplete="off"
            defaultValue={canonicalName}
            aria-invalid={state?.status === 'error' && state.field === 'name'}
            className={fieldControl}
          />
        </div>
        <div
          role="alert"
          aria-live="polite"
          className={formError}
        >
          {state?.status === 'error' && state.message}
        </div>
        <Button
          variant="outline"
          type="submit"
          disabled={isPending}
          className={fullWidthButton}
        >
          Apply
        </Button>
      </form>
    </>
  )
}

export { AddToHabUnitForm }
