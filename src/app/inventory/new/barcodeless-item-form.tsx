'use client'

import { useActionState, useState } from 'react'
import { clsx } from 'clsx'

import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import {
  fieldControl,
  fieldLabel,
  fieldStack,
  fullWidthButton,
} from '@/app/styles/class-names'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { createItemWithoutBarcode } from '../actions'

type BarcodelessItemFormState =
  Awaited<ReturnType<typeof createItemWithoutBarcode>> | null

interface BarcodelessChevronProps {
  readonly isOpen: boolean
}

const BarcodelessChevron = ({ isOpen }: BarcodelessChevronProps) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={clsx(
      'size-5',
      'shrink-0',
      'transition-transform',
      'duration-500',
      'ease-in-out',
      'motion-reduce:transition-none',
      isOpen && 'rotate-180',
    )}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
)

const BarcodelessItemForm = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(
    async (_prev: BarcodelessItemFormState, formData: FormData) =>
      createItemWithoutBarcode(formData),
    null,
  )

  const isNameInvalid = state?.status === 'error' && state.field === 'name'

  return (
    <div className={clsx('mt-12', 'flex', 'flex-col')}>
      <h2 className="m-0">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="barcodeless-item"
          onClick={() => setIsOpen((isCurrentlyOpen) => !isCurrentlyOpen)}
          className={clsx(
            'flex',
            'w-full',
            'items-center',
            'justify-between',
            'gap-3',
            'text-left',
            'font-mono',
            'text-base',
            'leading-7',
          )}
        >
          Or add an item without a barcode
          <BarcodelessChevron isOpen={isOpen} />
        </button>
      </h2>
      <div
        className={clsx(
          'grid',
          '-mx-1',
          'transition-[grid-template-rows]',
          'duration-500',
          'ease-in-out',
          'motion-reduce:transition-none',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className={clsx('min-h-0', 'overflow-hidden')}>
          <form
            id="barcodeless-item"
            action={formAction}
            inert={!isOpen}
            aria-hidden={!isOpen}
            className={clsx(
              'flex',
              'flex-col',
              'gap-4',
              'px-1',
              'pt-4',
              'pb-1',
              'transition-transform',
              'duration-500',
              'ease-in-out',
              'motion-reduce:transition-none',
              isOpen ? 'translate-y-0' : 'translate-y-3',
            )}
          >
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
            <FormAlert message={state?.status === 'error' ? state.message : null}>
              <Button
                variant="outline"
                type="submit"
                disabled={isPending}
                className={fullWidthButton}
              >
                Add without barcode
              </Button>
            </FormAlert>
          </form>
        </div>
      </div>
    </div>
  )
}

export { BarcodelessItemForm }
