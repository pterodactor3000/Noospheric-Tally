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

import { createItemsFromJsonFile } from '../actions'

type BulkInsertFormState =
  Awaited<ReturnType<typeof createItemsFromJsonFile>> | null

interface BulkInsertChevronProps {
  readonly isOpen: boolean
}

const BulkInsertChevron = ({ isOpen }: BulkInsertChevronProps) => (
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

const BulkInsertForm = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(
    async (_previous: BulkInsertFormState, formData: FormData) =>
      createItemsFromJsonFile(formData),
    null,
  )

  return (
    <div className={clsx('mt-12', 'flex', 'flex-col')}>
      <h2 className="m-0">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls="bulk-insert"
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
          Or add many items from a JSON file
          <BulkInsertChevron isOpen={isOpen} />
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
            id="bulk-insert"
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
              <Label htmlFor="bulk-insert-file" className={fieldLabel}>
                JSON file
              </Label>
              <Input
                type="file"
                name="file"
                id="bulk-insert-file"
                accept=".json,application/json"
                className={fieldControl}
              />
            </div>
            <FormAlert
              message={state?.status === 'error' ? state.message : null}
            >
              <Button
                variant="outline"
                type="submit"
                disabled={isPending}
                className={fullWidthButton}
              >
                Add items from file
              </Button>
            </FormAlert>
          </form>
        </div>
      </div>
    </div>
  )
}

export { BulkInsertForm }
