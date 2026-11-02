'use client'

import { useActionState, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'

import { Button } from '@/components/ui/button'
import { CountStepper } from '@/components/ui/count-stepper'
import { DotLeader } from '@/components/ui/dot-leader'
import { FormAlert } from '@/components/ui/form-alert'
import { Separator } from '@/components/ui/separator'
import { STOCK_STATE_TEXT_CLASS_NAMES } from '@/app/styles/stock-state-class-names'
import { formatConsumptionRate } from '@/lib/items/format-consumption-rate'
import {
  ITEM_CATEGORIES,
  ITEM_CATEGORY_LABELS,
  isItemCategory,
  type ItemCategory,
} from '@/lib/items/item-category'
import { HOUSEHOLD_QUANTITY_MAX } from '@/lib/items/validate-household-quantity'
import {
  getStockState,
  MINIMUM_QUANTITY_MAX,
  MINIMUM_QUANTITY_MIN,
  STOCK_STATE_INITIALS,
  STOCK_STATE_LABELS,
} from '@/lib/items/stock-state'

import { submitItemForm } from '../actions'
import { BarcodeLine, itemControl } from './barcode-line'

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
const itemNameText = clsx('min-w-0', 'truncate', 'leading-11')
const itemNameButton = clsx(
  itemNameText,
  'border-0',
  'bg-transparent',
  'p-0',
  'text-left',
  'font-[inherit]',
  'text-[length:inherit]',
  'text-inherit',
  'sm:hidden',
)
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
const itemValue = clsx('shrink-0', 'whitespace-nowrap')
const categoryField = clsx(
  'relative',
  'inline-block',
  'min-w-44',
  'focus-within:ring-2',
  'focus-within:ring-ring',
)
const categoryFieldLabel = clsx(
  'grid',
  'w-full',
  'grid-cols-[auto_1fr_auto]',
  'items-baseline',
)
const categorySelect = clsx(
  itemControl,
  'absolute',
  'inset-0',
  'cursor-pointer',
  'opacity-0',
)
const WIDE_ITEM_HEADING_QUERY = '(min-width: 40rem)'

const subscribeToWideItemHeading = (onStoreChange: () => void) => {
  const mediaQuery = window.matchMedia(WIDE_ITEM_HEADING_QUERY)
  mediaQuery.addEventListener('change', onStoreChange)
  return () => {
    mediaQuery.removeEventListener('change', onStoreChange)
  }
}

const getIsWideItemHeading = () =>
  window.matchMedia(WIDE_ITEM_HEADING_QUERY).matches

const getServerIsWideItemHeading = () => false

const useIsWideItemHeading = (): boolean =>
  useSyncExternalStore(
    subscribeToWideItemHeading,
    getIsWideItemHeading,
    getServerIsWideItemHeading,
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
interface ItemLevelEditorProps {
  readonly itemId: string
  readonly name: string
  readonly quantity: number
  readonly minimumQuantity: number
  readonly consumptionCount: number
  readonly category: ItemCategory
  readonly barcodes: readonly string[]
}

interface LevelStepperProps {
  readonly label: string
  readonly value: number
  readonly minimum: number
  readonly maximum: number
  readonly isUnsaved: boolean
  readonly onDecrease: () => void
  readonly onIncrease: () => void
}

const LevelStepper = ({
  label,
  value,
  minimum,
  maximum,
  isUnsaved,
  onDecrease,
  onIncrease,
}: LevelStepperProps) => (
  <div className={clsx(itemLine, isUnsaved && 'text-unsaved')}>
    <span className={itemLabel}>{label}</span>
    <DotLeader />
    <CountStepper
      name={label}
      value={value}
      density="comfortable"
      isDecreaseDisabled={value <= minimum}
      isIncreaseDisabled={value >= maximum}
      onDecrease={onDecrease}
      onIncrease={onIncrease}
    />
  </div>
)

const ItemLevelEditor = ({
  itemId,
  name,
  quantity,
  minimumQuantity,
  consumptionCount,
  category,
  barcodes,
}: ItemLevelEditorProps) => {
  const [count, setCount] = useState(quantity)
  const [minimum, setMinimum] = useState(minimumQuantity)
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory>(category)
  const [isBarcodeLineOpen, setIsBarcodeLineOpen] = useState(false)
  const [isHideArmed, setIsHideArmed] = useState(false)
  const isWideItemHeading = useIsWideItemHeading()
  const isBarcodeLineShown = isWideItemHeading || isBarcodeLineOpen
  const [state, formAction, isPending] = useActionState(
    async (
      _previous: Awaited<ReturnType<typeof submitItemForm>> | null,
      formData: FormData,
    ) => submitItemForm(formData),
    null,
  )
  const stockState = getStockState(count, minimum)
  const pendingUses = Math.max(0, quantity - count)
  const consumptionRate = formatConsumptionRate(consumptionCount + pendingUses)

  return (
    <form action={formAction}>
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="quantity" value={count} />
      <input type="hidden" name="minimumQuantity" value={minimum} />
      <input type="hidden" name="expectedQuantity" value={quantity} />
      <input type="hidden" name="expectedCategory" value={category} />
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
            <span className={clsx(itemNameText, 'max-sm:hidden')}>{name}</span>
            <button
              type="button"
              className={itemNameButton}
              aria-expanded={isBarcodeLineOpen}
              aria-controls="item-barcode-line"
              onClick={() => setIsBarcodeLineOpen((current) => !current)}
            >
              {name}
            </button>
            <DotLeader />
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
                <DotLeader />
                <BarcodeLine barcodes={barcodes} />
              </span>
            </div>
          </div>
        </h1>
        <Separator variant="heading" />
        <LevelStepper
          label="Count"
          value={count}
          minimum={0}
          maximum={HOUSEHOLD_QUANTITY_MAX}
          isUnsaved={count !== quantity}
          onDecrease={() => setCount((current) => current - 1)}
          onIncrease={() => setCount((current) => current + 1)}
        />
        <LevelStepper
          label="Minimum"
          value={minimum}
          minimum={MINIMUM_QUANTITY_MIN}
          maximum={MINIMUM_QUANTITY_MAX}
          isUnsaved={minimum !== minimumQuantity}
          onDecrease={() => setMinimum((current) => current - 1)}
          onIncrease={() => setMinimum((current) => current + 1)}
        />
        <div
          className={clsx(
            itemLine,
            selectedCategory !== category && 'text-unsaved',
          )}
        >
          <label htmlFor="item-category" className={itemLabel}>
            Category
          </label>
          <DotLeader />
          <span className={clsx(itemValue, categoryField)}>
            <span aria-hidden="true" className={categoryFieldLabel}>
              <span>[</span>
              <span className="text-center">
                {ITEM_CATEGORY_LABELS[selectedCategory]}
              </span>
              <span>]</span>
            </span>
            <select
              id="item-category"
              name="category"
              value={selectedCategory}
              onChange={(event) => {
                const nextCategory = event.currentTarget.value
                if (isItemCategory(nextCategory)) {
                  setSelectedCategory(nextCategory)
                }
              }}
              className={categorySelect}
            >
              {ITEM_CATEGORIES.map((itemCategory) => (
                <option key={itemCategory} value={itemCategory}>
                  {ITEM_CATEGORY_LABELS[itemCategory]}
                </option>
              ))}
            </select>
          </span>
        </div>
        <div className={clsx(itemLine, pendingUses > 0 && 'text-unsaved')}>
          <span className={itemLabel}>Use</span>
          <DotLeader />
          <span className={itemValue}>{consumptionRate}</span>
        </div>
      </div>
      <FormAlert
        message={state?.status === 'error' ? state.message : null}
        alertSpacing="top"
      >
        <div className={itemActions}>
          <Button
            type="submit"
            name="intent"
            value="save"
            variant="outline"
            size="touch"
            disabled={isPending}
            onClick={() => setIsHideArmed(false)}
          >
            Save
          </Button>
          <Button
            type="button"
            variant="outline"
            size="touch"
            nativeButton={false}
            render={<Link href="/inventory" />}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            name="intent"
            value="hide"
            variant="outline"
            size="touch"
            disabled={isPending}
            className="col-span-2"
            onClick={(event) => {
              if (isHideArmed) {
                return
              }

              event.preventDefault()
              setIsHideArmed(true)
            }}
          >
            {isHideArmed
              ? 'Confirm hide. This deletes the count and history'
              : 'Hide from tally'}
          </Button>
        </div>
      </FormAlert>
    </form>
  )
}

export { ItemLevelEditor }
