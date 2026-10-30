'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'

import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { actionButton } from '@/app/styles/class-names'
import { STOCK_STATE_TEXT_CLASS_NAMES } from '@/app/styles/stock-state-class-names'
import { HOUSEHOLD_QUANTITY_MAX } from '@/lib/items/validate-household-quantity'
import {
  getStockState,
  MINIMUM_QUANTITY_MAX,
  MINIMUM_QUANTITY_MIN,
  STOCK_STATE_LABELS,
} from '@/lib/items/stock-state'

import { saveItemLevels } from '../actions'

const ITEM_DOT_LEADER = '.'.repeat(300)

const itemRows = clsx('text-[14px]', 'sm:text-[16px]')
const itemLine = clsx('flex', 'items-baseline', 'gap-2')
const itemTitle = clsx(
  'm-0',
  'flex',
  'flex-col',
  'sm:flex-row',
  'sm:items-baseline',
  'sm:gap-2',
)
const itemLabel = clsx('min-h-11', 'min-w-0', 'truncate', 'leading-11')
const itemDots = clsx(
  'min-w-0',
  'flex-1',
  'overflow-hidden',
  'whitespace-nowrap',
)
const itemTitleDots = clsx(itemDots, 'hidden', 'sm:block')
const itemValue = clsx('shrink-0', 'whitespace-nowrap')
const itemControl = clsx(
  'min-h-11',
  'min-w-11',
  'border-0',
  'bg-transparent',
  'p-0',
  'font-[inherit]',
  'text-[length:inherit]',
  'leading-[inherit]',
  'text-inherit',
  'no-underline',
  'disabled:text-inherit',
  'disabled:opacity-100',
)
const itemActions = clsx(
  'mx-auto',
  'mt-8',
  'grid',
  'w-full',
  'max-w-lg',
  'grid-cols-2',
  'gap-4',
)
const itemActionButton = clsx(actionButton, 'w-full')

interface ItemLevelEditorProps {
  readonly itemId: string
  readonly name: string
  readonly quantity: number
  readonly minimumQuantity: number
  readonly barcode: string | null
}

interface LevelStepperProps {
  readonly label: string
  readonly value: number
  readonly minimum: number
  readonly maximum: number
  readonly onDecrease: () => void
  readonly onIncrease: () => void
}

const LevelStepper = ({
  label,
  value,
  minimum,
  maximum,
  onDecrease,
  onIncrease,
}: LevelStepperProps) => (
  <div className={itemLine}>
    <span className={itemLabel}>{label}</span>
    <span aria-hidden="true" className={itemDots}>
      {ITEM_DOT_LEADER}
    </span>
    <span className={itemValue}>
      <button
        type="button"
        disabled={value <= minimum}
        aria-label={`Decrease ${label}`}
        className={itemControl}
        onClick={onDecrease}
      >
        [-]
      </button>{' '}
      {value}{' '}
      <button
        type="button"
        disabled={value >= maximum}
        aria-label={`Increase ${label}`}
        className={itemControl}
        onClick={onIncrease}
      >
        [+]
      </button>
    </span>
  </div>
)

const ItemLevelEditor = ({
  itemId,
  name,
  quantity,
  minimumQuantity,
  barcode,
}: ItemLevelEditorProps) => {
  const [count, setCount] = useState(quantity)
  const [minimum, setMinimum] = useState(minimumQuantity)
  const [state, formAction, isPending] = useActionState(
    async (_previous: Awaited<ReturnType<typeof saveItemLevels>> | null, formData: FormData) =>
      saveItemLevels(formData),
    null,
  )
  const stockState = getStockState(count, minimum)

  return (
    <form action={formAction}>
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="quantity" value={count} />
      <input type="hidden" name="minimumQuantity" value={minimum} />
      <div className={itemRows}>
        <h1 className={itemTitle}>
          <span className={clsx(itemLabel, 'w-full', 'sm:w-auto')}>
            <span
              className={clsx(
                'font-bold',
                STOCK_STATE_TEXT_CLASS_NAMES[stockState],
              )}
            >
              [{STOCK_STATE_LABELS[stockState]}]
            </span>{' '}
            {name}
          </span>
          {barcode === null ? null : (
            <>
              <span aria-hidden="true" className={itemTitleDots}>
                {ITEM_DOT_LEADER}
              </span>
              <span className={clsx(itemValue, 'leading-11', 'sm:leading-[inherit]')}>
                {` ++  ${barcode} ++`}
              </span>
            </>
          )}
        </h1>
        <LevelStepper
          label="Count"
          value={count}
          minimum={0}
          maximum={HOUSEHOLD_QUANTITY_MAX}
          onDecrease={() => setCount((current) => current - 1)}
          onIncrease={() => setCount((current) => current + 1)}
        />
        <LevelStepper
          label="Minimum"
          value={minimum}
          minimum={MINIMUM_QUANTITY_MIN}
          maximum={MINIMUM_QUANTITY_MAX}
          onDecrease={() => setMinimum((current) => current - 1)}
          onIncrease={() => setMinimum((current) => current + 1)}
        />
      </div>
      <FormAlert
        message={state?.status === 'error' ? state.message : null}
        alertClassName="pt-4"
      >
        <div className={itemActions}>
          <Button
            type="submit"
            variant="outline"
            disabled={isPending}
            className={itemActionButton}
          >
            Save
          </Button>
          <Button
            type="button"
            variant="outline"
            nativeButton={false}
            render={<Link href="/inventory" />}
            className={itemActionButton}
          >
            Cancel
          </Button>
        </div>
      </FormAlert>
    </form>
  )
}

export { ItemLevelEditor }
