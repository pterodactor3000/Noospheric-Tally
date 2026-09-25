'use client'

import { useActionState, useState } from 'react'
import { attachBarcode, createItem } from '../actions'
import { clsx } from 'clsx'
import { Button } from '@/components/ui/button'
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
      <h1 className={pageTitle}>
        Item data creation
      </h1>
      <p className={pageLead}>
        Provide name for the item with designated barcode // {barcode}
      </p>
      <form
        action={createFormAction}
        className={formStack}
      >
        <input type="hidden" name="barcode" value={barcode} />
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
            defaultValue={defaultName}
            aria-invalid={
              createState?.status === 'error' && createState.field === 'name'
            }
            className={fieldControl}
          />
        </div>
        <div
          role="alert"
          aria-live="polite"
          className={formError}
        >
          {createState?.status === 'error' && createState.message}
        </div>
        <Button
          variant="outline"
          type="submit"
          disabled={isCreatePending}
          className={fullWidthButton}
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
          <div className={fieldStack}>
            <Label
              htmlFor="filter"
              className={fieldLabel}
            >
              Filter
            </Label>
            <Input
              type="search"
              id="filter"
              autoComplete="off"
              value={filter}
              onChange={(event) => setFilter(event.currentTarget.value)}
              className={fieldControl}
            />
          </div>
          <fieldset
            className={fieldStack}
            aria-invalid={attachState?.status === 'error'}
          >
            <legend className={fieldLabel}>
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
            className={formError}
          >
            {attachState?.status === 'error' && attachState.message}
          </div>
          <Button
            variant="outline"
            type="submit"
            disabled={isAttachPending}
            className={fullWidthButton}
          >
            Attach
          </Button>
        </form>
      )}
    </>
  )
}

export { ItemCreateForm }
