'use client'

import { useState, useTransition, type ReactNode } from 'react'
import { clsx } from 'clsx'

import { ITEM_WRITE_FAILURE_MESSAGE } from '@/lib/items/scan-failure-messages'
import type { QuantityAdjustment } from '@/lib/items/quantity-adjustment'

import { adjustItemQuantity } from './actions'

interface TallyCountControlsProps {
  readonly itemId: string
  readonly name: string
  readonly quantity: number
  readonly stockStateLabel: string
  readonly stockTextClassName: string
  readonly children: ReactNode
}

const tallyCount = clsx('shrink-0', 'whitespace-nowrap')
const tallyControl = clsx(
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
const tallyLine = clsx('flex', 'items-baseline', 'gap-2')
const tallyAlert = clsx('min-h-6', 'text-sm', 'font-mono', 'font-semibold')

const TallyCountControls = ({
  itemId,
  name,
  quantity,
  stockStateLabel,
  stockTextClassName,
  children,
}: TallyCountControlsProps) => {
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const adjustCount = (deltaQuantity: QuantityAdjustment) => {
    setErrorMessage(null)
    startTransition(async () => {
      try {
        const result = await adjustItemQuantity(itemId, deltaQuantity)
        if (result.status === 'error') {
          setErrorMessage(result.message)
        }
      } catch (error: unknown) {
        console.error('adjustItemQuantity failed', {
          itemId,
          deltaQuantity,
          error,
        })
        setErrorMessage(ITEM_WRITE_FAILURE_MESSAGE)
      }
    })
  }

  return (
    <div>
      <div className={tallyLine}>
        {children}
        <span className={clsx(tallyCount, stockTextClassName)}>
          <button
            type="button"
            disabled={isPending || quantity === 0}
            aria-label={`Decrease ${name}`}
            className={tallyControl}
            onClick={() => {
              adjustCount(-1)
            }}
          >
            [-]
          </button>{' '}
          {quantity}{' '}
          <button
            type="button"
            disabled={isPending}
            aria-label={`Increase ${name}`}
            className={tallyControl}
            onClick={() => {
              adjustCount(1)
            }}
          >
            [+]
          </button>
          <span className="sr-only">{stockStateLabel}</span>
        </span>
      </div>
      {errorMessage === null ? null : (
        <p role="alert" className={tallyAlert}>
          {errorMessage}
        </p>
      )}
    </div>
  )
}

export default TallyCountControls
