'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { clsx } from 'clsx'
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
      <h1
        className={clsx(
          'font-mono',
          'uppercase',
          'text-balance',
          'text-4xl',
          'font-semibold',
          'tracking-tight',
          'sm:text-5xl',
        )}
      >
        Add to hab-unit
      </h1>
      <p
        className={clsx(
          'font-mono',
          'mt-6',
          'text-pretty',
          'text-foreground/70',
          'leading-7',
          'text-base',
        )}
      >
        Confirm or edit the item name
      </p>
      <form
        action={formAction}
        className={clsx('mt-8', 'flex', 'flex-col', 'gap-4')}
      >
        <input type="hidden" name="itemId" value={itemId} />
        <div className={clsx('flex', 'flex-col', 'gap-2')}>
          <Label
            htmlFor="name"
            className={clsx('text-sm', 'font-medium', 'font-mono')}
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
            className={clsx('min-h-11', 'text-base', 'font-mono')}
          />
        </div>
        <div
          role="alert"
          aria-live="polite"
          className={clsx(
            'min-h-6',
            'text-sm',
            'text-red-700',
            'font-mono',
            'font-semibold',
          )}
        >
          {state?.status === 'error' && state.message}
        </div>
        <Button
          variant="outline"
          type="submit"
          disabled={isPending}
          className={clsx('font-mono', 'min-h-11', 'w-full')}
        >
          Apply
        </Button>
      </form>
    </>
  )
}

export { AddToHabUnitForm }
