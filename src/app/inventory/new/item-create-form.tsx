'use client'

import { useActionState, useState } from 'react'
import { attachBarcode, createItem } from '../actions'
import { clsx } from 'clsx'
import { FormAlert } from '@/components/form-alert'
import { ItemListMarker } from '@/components/item-list-marker'
import { Button } from '@/components/ui/button'
import {
  fieldControl,
  fieldLabel,
  fieldStack,
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
  householdMissMessage: string
  catalogMissMessage: string | null
}

type ItemCreateFormState = Awaited<ReturnType<typeof createItem>> | null
type ItemAttachFormState = Awaited<ReturnType<typeof attachBarcode>> | null

interface AttachChevronProps {
  readonly isOpen: boolean
}

const attachList = clsx('mt-[1rem]', 'text-[14px]', 'sm:text-[16px]')
const attachName = clsx(
  'block',
  'min-h-[36px]',
  'min-w-0',
  'truncate',
  'leading-[36px]',
  'peer-checked:text-stock-warning',
  'peer-focus-visible:ring-2',
  'peer-focus-visible:ring-ring',
)

const AttachChevron = ({ isOpen }: AttachChevronProps) => (
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

const ItemCreateForm = ({
  barcode,
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
  const [isAttachOpen, setIsAttachOpen] = useState(false)
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
        <FormAlert
          message={createState?.status === 'error' ? createState.message : null}
        >
          <Button
            variant="outline"
            type="submit"
            disabled={isCreatePending}
            className={fullWidthButton}
          >
            Apply
          </Button>
        </FormAlert>
      </form>
      {habUnitItems.length === 0 ? null : (
        <div className={clsx('mt-12', 'flex', 'flex-col')}>
          <h2 className="m-0">
            <button
              type="button"
              aria-expanded={isAttachOpen}
              aria-controls="attach-existing-item"
              onClick={() => setIsAttachOpen((isOpen) => !isOpen)}
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
              Attach to existing item
              <AttachChevron isOpen={isAttachOpen} />
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
              isAttachOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
            )}
          >
            <div className={clsx('min-h-0', 'overflow-hidden')}>
              <form
                id="attach-existing-item"
                action={attachFormAction}
                inert={!isAttachOpen}
                aria-hidden={!isAttachOpen}
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
                  isAttachOpen ? 'translate-y-0' : 'translate-y-3',
                )}
              >
                <input type="hidden" name="barcode" value={barcode} />
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
                <fieldset aria-invalid={attachState?.status === 'error'}>
                  <legend className={fieldLabel}>Item designation</legend>
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
                          <ItemListMarker />
                          <span className={attachName}>{item.name}</span>
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
                    className={fullWidthButton}
                  >
                    Attach
                  </Button>
                </FormAlert>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export { ItemCreateForm }
