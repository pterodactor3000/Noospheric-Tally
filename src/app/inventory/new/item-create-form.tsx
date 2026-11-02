'use client'

import { useActionState, useState } from 'react'
import { attachBarcode, createItem } from '../actions'
import { clsx } from 'clsx'
import { Button } from '@/components/ui/button'
import { Disclosure } from '@/components/ui/disclosure'
import { FormAlert } from '@/components/ui/form-alert'
import { ItemListMarker } from '@/components/ui/item-list-marker'
import {
  fieldStack,
  formFields,
  formStack,
  pageLead,
  pageTitle,
} from '@/app/styles/class-names'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type ItemCategory } from '@/lib/items/item-category'
import { Item } from '@/lib/types'
import { AlreadyStocked } from './already-stocked'

interface ItemCreateFormProps {
  barcode: string
  category: ItemCategory
  habUnitItems: Item[]
  defaultName?: string
  householdMissMessage: string
  catalogMissMessage: string | null
}

type ItemCreateFormState = Awaited<ReturnType<typeof createItem>> | null
type ItemAttachFormState = Awaited<ReturnType<typeof attachBarcode>> | null

const attachLegend = clsx('text-sm', 'font-medium')
const attachList = clsx('mt-[1rem]', 'text-[14px]', 'sm:text-[16px]')
const attachName = clsx(
  'block',
  'min-h-[36px]',
  'min-w-0',
  'truncate',
  'leading-[36px]',
  'peer-checked:text-stock-warning-text',
  'peer-focus-visible:ring-2',
  'peer-focus-visible:ring-ring',
)
const attachBracket = clsx(
  'hidden',
  'shrink-0',
  'peer-checked:inline',
  'peer-checked:text-stock-warning-text',
)

const ItemCreateForm = ({
  barcode,
  category,
  habUnitItems,
  defaultName = '',
  householdMissMessage,
  catalogMissMessage,
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
        Provide name for the item with designated barcode //{' '}
        <strong className="font-bold text-foreground">{barcode}</strong>
      </p>
      <p role="status" className={pageLead}>
        {householdMissMessage}
      </p>
      {catalogMissMessage === null ? null : (
        <p role="status" className={pageLead}>
          {catalogMissMessage}
        </p>
      )}
      <form
        action={createFormAction}
        className={formStack}
      >
        <input type="hidden" name="barcode" value={barcode} />
        <input type="hidden" name="category" value={category} />
        <div className={fieldStack}>
          <Label htmlFor="name">
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
          />
        </div>
        <FormAlert
          message={createState?.status === 'error' ? createState.message : null}
        >
          <Button
            variant="outline"
            type="submit"
            disabled={isCreatePending}
            size="touch"
          >
            Apply
          </Button>
        </FormAlert>
      </form>
      {habUnitItems.length === 0 ? null : (
        <Disclosure title="Attach to existing item" contentId="attach-existing-item">
          <form action={attachFormAction} className={formFields}>
            <input type="hidden" name="barcode" value={barcode} />
            <div className={fieldStack}>
              <Label htmlFor="filter">Filter</Label>
              <Input
                type="search"
                id="filter"
                autoComplete="off"
                value={filter}
                onChange={(event) => setFilter(event.currentTarget.value)}
              />
            </div>
            <fieldset aria-invalid={attachState?.status === 'error'}>
              <legend className={attachLegend}>Item designation</legend>
              <ul className={attachList}>
                {offeredItems.map((item) => (
                  <li key={item.itemId} className="px-2">
                    <label className="flex cursor-pointer items-baseline gap-2">
                      <input
                        type="radio"
                        name="itemId"
                        value={item.itemId}
                        required
                        className="peer sr-only"
                      />
                      <ItemListMarker highlight="peer-checked" />
                      <span aria-hidden="true" className={attachBracket}>
                        {'['}
                      </span>
                      <span className={attachName}>{item.name}</span>
                      <span aria-hidden="true" className={attachBracket}>
                        {']'}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>
            <FormAlert
              message={
                attachState?.status === 'error' ? attachState.message : null
              }
            >
              <Button
                variant="outline"
                type="submit"
                disabled={isAttachPending}
                size="touch"
              >
                Attach
              </Button>
            </FormAlert>
          </form>
        </Disclosure>
      )}
    </>
  )
}

export { ItemCreateForm }
