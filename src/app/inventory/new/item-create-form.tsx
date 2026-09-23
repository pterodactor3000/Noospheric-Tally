'use client'

import { useActionState, useState } from 'react'
import { attachBarcode, createItem } from '../actions'
import { clsx } from 'clsx'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Item } from '@/lib/types'
import { AlreadyStocked } from './already-stocked'

interface ItemCreateFormProps {
  barcode: string
  habUnitItems: Item[]
  defaultName?: string
}

type ItemCreateFormState = Awaited<ReturnType<typeof createItem>> | null
type ItemAttachFormState = Awaited<ReturnType<typeof attachBarcode>> | null

const ItemCreateForm = ({
  barcode,
  habUnitItems,
  defaultName = '',
}: ItemCreateFormProps) => {
  const [createState, createFormAction, isCreatePending] = useActionState(
    async (_prev: ItemCreateFormState, formData: FormData) =>
      createItem(formData),
    null,
  )

  const [attachState, attachFormAction, isAttachPending] = useActionState(
    async (_prev: ItemAttachFormState, formData: FormData) =>
      attachBarcode(formData),
    null,
  )

  const [filter, setFilter] = useState('')
  const normalizedFilter = filter.trim().toLowerCase()
  const offeredItems =
    normalizedFilter.length === 0
      ? habUnitItems
      : habUnitItems.filter((item) =>
          item.name.toLowerCase().includes(normalizedFilter),
        )

  if (createState?.status === 'exists') {
    return <AlreadyStocked name={createState.name} />
  }

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
        Item data creation
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
        Provide name for the item with designated barcode // {barcode}
      </p>
      <form
        action={createFormAction}
        className={clsx('mt-8', 'flex', 'flex-col', 'gap-4')}
      >
        <input type="hidden" name="barcode" value={barcode} />
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
            defaultValue={defaultName}
            aria-invalid={
              createState?.status === 'error' && createState.field === 'name'
            }
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
          {createState?.status === 'error' && createState.message}
        </div>
        <Button
          variant="outline"
          type="submit"
          disabled={isCreatePending}
          className={clsx('font-mono', 'min-h-11', 'w-full')}
        >
          Apply
        </Button>
      </form>
      {habUnitItems.length === 0 ? null : (
        <form
          action={attachFormAction}
          className={clsx('mt-12', 'flex', 'flex-col', 'gap-4')}
        >
          <input type="hidden" name="barcode" value={barcode} />
          <h2
            className={clsx(
              'font-mono',
              'text-2xl',
              'font-semibold',
              'tracking-tight',
            )}
          >
            Attach to existing item
          </h2>
          <div className={clsx('flex', 'flex-col', 'gap-2')}>
            <Label
              htmlFor="filter"
              className={clsx('text-sm', 'font-medium', 'font-mono')}
            >
              Filter
            </Label>
            <Input
              type="search"
              id="filter"
              autoComplete="off"
              value={filter}
              onChange={(event) => setFilter(event.currentTarget.value)}
              className={clsx('min-h-11', 'text-base', 'font-mono')}
            />
          </div>
          <fieldset
            className={clsx('flex', 'flex-col', 'gap-2')}
            aria-invalid={attachState?.status === 'error'}
          >
            <legend className={clsx('text-sm', 'font-medium', 'font-mono')}>
              Household items
            </legend>
            {offeredItems.map((item) => (
              <label
                key={item.itemId}
                className={clsx(
                  'flex',
                  'min-h-11',
                  'items-center',
                  'gap-3',
                  'font-mono',
                )}
              >
                <input
                  type="radio"
                  name="itemId"
                  value={item.itemId}
                  required
                />
                {item.name}
              </label>
            ))}
          </fieldset>
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
            {attachState?.status === 'error' && attachState.message}
          </div>
          <Button
            variant="outline"
            type="submit"
            disabled={isAttachPending}
            className={clsx('font-mono', 'min-h-11', 'w-full')}
          >
            Attach
          </Button>
        </form>
      )}
    </>
  )
}

export { ItemCreateForm }
