'use client'

import { useActionState } from 'react'
import { clsx } from 'clsx'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createHabUnit } from '../actions'

type HabUnitFormState = {
  status: 'error' | 'success' | 'pending'
  message: string
  field?: 'name'
} | null

const HabUnitNameForm = () => {
  const [state, formAction, isPending] = useActionState(
    async (_prev: HabUnitFormState, formData: FormData) =>
      createHabUnit(formData),
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
        Hab-unit data creation
      </h1>
      <p
        className={clsx(
          'font-mono',
          'uppercase',
          'mt-6',
          'text-pretty',
          'text-foreground/70',
          'leading-7',
          'text-base',
        )}
      >
        Provide your hab-unit designation
      </p>

      <form
        action={formAction}
        className={clsx('mt-8', 'flex', 'flex-col', 'gap-4')}
      >
        <div className={clsx('flex', 'flex-col', 'gap-2')}>
          <Label
            htmlFor="name"
            className={clsx('text-sm', 'font-medium', 'font-mono', 'uppercase')}
          >
            Hab-unit designation
          </Label>
          <Input
            type="text"
            name="name"
            id="name"
            autoComplete="name"
            aria-invalid={state?.field === 'name'}
            className={clsx('min-h-11', 'text-base', 'font-mono', 'uppercase')}
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
            'uppercase',
            'font-semibold',
          )}
        >
          {state?.status === 'error' && state?.message}
        </div>

        <Button
          variant="outline"
          type="submit"
          disabled={isPending}
          className={clsx('font-mono', 'uppercase', 'min-h-11', 'w-full')}
        >
          Apply
        </Button>
      </form>
    </>
  )
}

export default HabUnitNameForm
