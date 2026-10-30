'use client'

import { useActionState, useState } from 'react'
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
const MINIMUM_QUANTITY_ERROR_ID = 'minimum-quantity-error'

const ItemMinimumForm = ({ itemId, minimumQuantity }: ItemMinimumFormProps) => {
  const [inputValue, setInputValue] = useState(String(minimumQuantity))
  const [state, formAction, isPending] = useActionState(
    async (_prev: ItemMinimumFormState, formData: FormData) =>
      saveItemMinimumQuantity(formData),
    null,
  )
  const [seenState, setSeenState] = useState(state)

  if (state !== seenState) {
    setSeenState(state)
    if (state?.status === 'saved') {
      setInputValue(String(state.minimumQuantity))
    }
  }

  const isMinimumFieldError =
    state?.status === 'error' && state.field === 'minimum'

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
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          aria-invalid={isMinimumFieldError}
          aria-describedby={
            isMinimumFieldError ? MINIMUM_QUANTITY_ERROR_ID : undefined
          }
          className={fieldControl}
        />
      </div>
      <div
        id={MINIMUM_QUANTITY_ERROR_ID}
        role="alert"
        aria-live="polite"
        className={formError}
      >
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
