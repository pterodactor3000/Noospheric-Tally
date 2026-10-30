'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import {
  fieldControl,
  fieldLabel,
  fieldStack,
  formError,
  formStack,
  fullWidthButton,
  sectionHeading,
} from '@/app/styles/class-names'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { createItemWithoutBarcode } from '../actions'

type BarcodelessItemFormState =
  Awaited<ReturnType<typeof createItemWithoutBarcode>> | null

const BarcodelessItemForm = () => {
  const [state, formAction, isPending] = useActionState(
    async (_prev: BarcodelessItemFormState, formData: FormData) =>
      createItemWithoutBarcode(formData),
    null,
  )

  const isNameInvalid = state?.status === 'error' && state.field === 'name'

  return (
    <>
      <h2 className={sectionHeading}>Or add an item without a barcode</h2>
      <form action={formAction} className={formStack}>
        <div className={fieldStack}>
          <Label htmlFor="barcodeless-item-name" className={fieldLabel}>
            Item name
          </Label>
          <Input
            type="text"
            name="name"
            id="barcodeless-item-name"
            autoComplete="off"
            aria-invalid={isNameInvalid}
            className={fieldControl}
          />
        </div>
        <div role="alert" aria-live="polite" className={formError}>
          {state?.status === 'error' && state.message}
        </div>
        <Button
          variant="outline"
          type="submit"
          disabled={isPending}
          className={fullWidthButton}
        >
          Add without barcode
        </Button>
      </form>
    </>
  )
}

export { BarcodelessItemForm }
