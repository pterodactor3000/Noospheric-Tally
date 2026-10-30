'use client'

import { useActionState, useEffect, useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'

import { FormAlert } from '@/components/form-alert'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { actionButton } from '@/app/styles/class-names'
import { STOCK_STATE_TEXT_CLASS_NAMES } from '@/app/styles/stock-state-class-names'
import { HOUSEHOLD_QUANTITY_MAX } from '@/lib/items/validate-household-quantity'
import {
  getStockState,
  MINIMUM_QUANTITY_MAX,
  MINIMUM_QUANTITY_MIN,
  STOCK_STATE_INITIALS,
  STOCK_STATE_LABELS,
} from '@/lib/items/stock-state'

import { saveItemLevels } from '../actions'
import { BarcodeLine, itemControl } from './barcode-line'

const ITEM_DOT_LEADER = '.'.repeat(300)

const itemRows = clsx('text-[14px]', 'sm:text-[16px]')
const itemLine = clsx('flex', 'items-baseline', 'gap-2')
const itemTitle = clsx(
  'm-0',
  'flex',
  'w-full',
  'min-w-0',
  'flex-col',
  'text-base',
  'sm:text-lg',
)
const itemHeadingLine = clsx(itemLine, 'w-full', 'min-w-0')
const itemNameLabel = clsx('min-w-0', 'truncate', 'leading-11')
const itemStatus = clsx('shrink-0', 'font-bold', 'leading-11')
const barcodeReveal = clsx(
  'grid',
  'transition-[grid-template-rows]',
  'duration-500',
  'ease-in-out',
  'motion-reduce:transition-none',
  'sm:grid-rows-[1fr]',
)
const barcodeRevealInner = clsx('min-h-0', 'overflow-hidden')
const barcodeLineMotion = clsx(
  itemLine,
  'pt-2',
  'transition-transform',
  'duration-500',
  'ease-in-out',
  'motion-reduce:transition-none',
  'sm:translate-y-0',
)
const itemLabel = clsx('min-h-11', 'min-w-0', 'truncate', 'leading-11')
const itemDots = clsx(
  'min-w-0',
  'flex-1',
  'overflow-hidden',
  'whitespace-nowrap',
)
const itemValue = clsx('shrink-0', 'whitespace-nowrap')
const WIDE_ITEM_HEADING_QUERY = '(min-width: 40rem)'

const useIsWideItemHeading = (): boolean => {
  const [isWide, setIsWide] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(WIDE_ITEM_HEADING_QUERY)
    const updateIsWide = () => {
      setIsWide(mediaQuery.matches)
    }

    updateIsWide()
    mediaQuery.addEventListener('change', updateIsWide)
    return () => {
      mediaQuery.removeEventListener('change', updateIsWide)
    }
  }, [])

  return isWide
}
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
  readonly barcodes: readonly string[]
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
  barcodes,
}: ItemLevelEditorProps) => {
  const [count, setCount] = useState(quantity)
  const [minimum, setMinimum] = useState(minimumQuantity)
  const [isBarcodeLineOpen, setIsBarcodeLineOpen] = useState(false)
  const isWideItemHeading = useIsWideItemHeading()
  const isBarcodeLineShown = isWideItemHeading || isBarcodeLineOpen
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
      <input type="hidden" name="expectedQuantity" value={quantity} />
      <div className={itemRows}>
        <h1 className={itemTitle}>
          <span className={itemHeadingLine}>
            <span
              className={clsx(
                itemStatus,
                STOCK_STATE_TEXT_CLASS_NAMES[stockState],
              )}
            >
              <span className="max-[459px]:sr-only">
                [{STOCK_STATE_LABELS[stockState]}]
              </span>
              <span aria-hidden="true" className="min-[460px]:hidden">
                [{STOCK_STATE_INITIALS[stockState]}]
              </span>
            </span>
            <label
              className={itemNameLabel}
              aria-expanded={isBarcodeLineOpen}
              aria-controls="item-barcode-line"
              onClick={() => setIsBarcodeLineOpen((current) => !current)}
            >
              {name}
            </label>
            <span aria-hidden="true" className={itemDots}>
              {ITEM_DOT_LEADER}
            </span>
          </span>
          <div
            className={clsx(
              barcodeReveal,
              isBarcodeLineOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
            )}
          >
            <div className={barcodeRevealInner}>
              <span
                id="item-barcode-line"
                aria-hidden={!isBarcodeLineShown}
                inert={!isBarcodeLineShown ? true : undefined}
                className={clsx(
                  barcodeLineMotion,
                  isBarcodeLineOpen ? 'translate-y-0' : 'translate-y-3',
                )}
              >
                <span aria-hidden="true" className={itemDots}>
                  {ITEM_DOT_LEADER}
                </span>
                <BarcodeLine barcodes={barcodes} />
              </span>
            </div>
          </div>
        </h1>
        <Separator className="my-2 h-0.5! shadow-[0_0_8px] shadow-primary/40" />
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
