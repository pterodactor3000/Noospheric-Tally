'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Disclosure } from '@/components/ui/disclosure'
import { FormAlert } from '@/components/ui/form-alert'
import { fieldStack, formFields } from '@/app/styles/class-names'
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
    <Disclosure
      title="Or add an item without a barcode"
      contentId="barcodeless-item"
    >
      <form action={formAction} className={formFields}>
        <div className={fieldStack}>
          <Label htmlFor="barcodeless-item-name">Item name</Label>
          <Input
            type="text"
            name="name"
            id="barcodeless-item-name"
            autoComplete="off"
            aria-invalid={isNameInvalid}
          />
        </div>
        <FormAlert message={state?.status === 'error' ? state.message : null}>
          <Button
            variant="outline"
            type="submit"
            disabled={isPending}
            size="touch"
          >
            Add without barcode
          </Button>
        </FormAlert>
      </form>
    </Disclosure>
  )
}

export { BarcodelessItemForm }
