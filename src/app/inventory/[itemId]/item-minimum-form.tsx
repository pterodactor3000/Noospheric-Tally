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
} from '@/app/styles/class-names'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveItemMinimumQuantity } from '../actions'

interface ItemMinimumFormProps {
  itemId: string
  minimumQuantity: number
}

type ItemMinimumFormState =
  | { status: 'error'; message: string; field?: 'name' | 'barcode' | 'minimum' }
  | { status: 'saved'; minimumQuantity: number }
  | null

const formStatus = clsx('min-h-6', 'text-sm', 'font-mono', 'font-semibold')

const ItemMinimumForm = ({ itemId, minimumQuantity }: ItemMinimumFormProps) => {
  const [state, formAction, isPending] = useActionState(
    async (_prev: ItemMinimumFormState, formData: FormData) =>
      saveItemMinimumQuantity(formData),
    null,
  )

  return (
    <form action={formAction} className={formStack}>
      <input type="hidden" name="itemId" value={itemId} />
      <div className={fieldStack}>
        <Label
          htmlFor="minimumQuantity"
          className={clsx(fieldLabel, 'uppercase')}
        >
          Minimum quantity
        </Label>
        <Input
          type="text"
          name="minimumQuantity"
          id="minimumQuantity"
          inputMode="numeric"
          autoComplete="off"
          defaultValue={minimumQuantity}
          aria-invalid={state?.status === 'error' && state.field === 'minimum'}
          className={fieldControl}
        />
      </div>
      <div role="alert" aria-live="polite" className={formError}>
        {state?.status === 'error' && state.message}
      </div>
      <div role="status" aria-live="polite" className={formStatus}>
        {state?.status === 'saved' && 'Minimum saved.'}
      </div>

      <Button
        variant="outline"
        type="submit"
        disabled={isPending}
        className={clsx(fullWidthButton, 'uppercase')}
      >
        Save minimum
      </Button>
    </form>
  )
}

export default ItemMinimumForm
