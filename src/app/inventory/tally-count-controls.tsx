'use client'

import { useEffect, useState, useTransition, type ReactNode } from 'react'
import { clsx } from 'clsx'

import { CountStepper } from '@/components/ui/count-stepper'
import { ITEM_WRITE_FAILURE_MESSAGE } from '@/lib/items/scan-failure-messages'
import type { QuantityAdjustment } from '@/lib/items/quantity-adjustment'
import { HOUSEHOLD_QUANTITY_MAX } from '@/lib/items/validate-household-quantity'

import { adjustItemQuantity } from './actions'

interface TallyCountControlsProps {
  readonly itemId: string
  readonly name: string
  readonly quantity: number
  readonly stockStateLabel: string
  readonly stockTextClassName: string
  readonly onPendingChange?: (itemId: string, isPending: boolean) => void
  readonly children: ReactNode
}

const tallyLine = clsx('flex', 'items-center', 'gap-2')
const tallyAlert = clsx(
  'min-h-6',
  'text-sm',
  'font-mono',
  'font-semibold',
  'motion-safe:animate-form-alert-in',
)

const TallyCountControls = ({
  itemId,
  name,
  quantity,
  stockStateLabel,
  stockTextClassName,
  onPendingChange,
  children,
}: TallyCountControlsProps) => {
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    onPendingChange?.(itemId, isPending)
    return () => {
      onPendingChange?.(itemId, false)
    }
  }, [isPending, itemId, onPendingChange])

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
      <div className={clsx(tallyLine, stockTextClassName)}>
        {children}
        <CountStepper
          name={name}
          value={quantity}
          density="compact"
          isDecreaseDisabled={isPending || quantity === 0}
          isIncreaseDisabled={isPending || quantity >= HOUSEHOLD_QUANTITY_MAX}
          onDecrease={() => {
            adjustCount(-1)
          }}
          onIncrease={() => {
            adjustCount(1)
          }}
        >
          <span className="sr-only">{stockStateLabel}</span>
        </CountStepper>
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
