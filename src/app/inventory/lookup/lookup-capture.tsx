'use client'

import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'

import { BarcodeScanner } from '@/components/barcode-scanner'
import { centeredPage } from '@/app/styles/class-names'
import { STOCK_STATE_TEXT_CLASS_NAMES } from '@/app/styles/stock-state-class-names'
import type { LookupDisplay } from '@/lib/items/resolve-lookup-display'
import { STOCK_STATE_LABELS } from '@/lib/items/stock-state'

const LOOKUP_BLOCKED_MESSAGE = 'Not in your hab unit.'
const LOOKUP_NOTICE_COUNT_LABEL = 'Count'
const LOOKUP_NOTICE_DOT_LEADER = '.'.repeat(300)

const noticeOverlay = clsx(
  'pointer-events-none',
  'absolute',
  'top-[max(0.75rem,env(safe-area-inset-top))]',
  'left-1/2',
  'z-50',
  'flex',
  'w-[min(24rem,calc(100%-1.5rem))]',
  '-translate-x-1/2',
  'flex-col',
  'gap-3',
)

const noticeCard = clsx(
  'pointer-events-auto',
  'border-2',
  'border-ring',
  'bg-card',
  'px-4',
  'py-3',
  'font-mono',
  'text-card-foreground',
  'shadow-lg',
  'shadow-primary/25',
)

const noticeSentence = clsx(
  'text-base',
  'leading-6',
  'text-pretty',
  'wrap-break-word',
)

const noticeCountLine = clsx(
  'mt-2',
  'flex',
  'w-full',
  'min-w-0',
  'items-baseline',
  'gap-2',
  'text-base',
  'leading-6',
)

const noticeDots = clsx(
  'min-w-0',
  'flex-1',
  'overflow-hidden',
  'whitespace-nowrap',
)

const noticeCountValue = clsx('shrink-0', 'whitespace-nowrap')

interface LookupCaptureProps {
  readonly defaultBarcode?: string
  readonly errorMessage?: string
  readonly failureMessage?: string
  readonly holdBarcode?: string
  readonly display?: LookupDisplay
}

interface LookupNoticeProps {
  readonly failureMessage?: string
  readonly display?: LookupDisplay
}

const LookupNotice = ({ failureMessage, display }: LookupNoticeProps) => {
  if (failureMessage) {
    return (
      <p
        role="alert"
        aria-live="polite"
        className={clsx(noticeCard, noticeSentence)}
      >
        {failureMessage}
      </p>
    )
  }

  if (display?.status === 'blocked') {
    return (
      <p
        role="status"
        aria-live="polite"
        className={clsx(noticeCard, noticeSentence)}
      >
        {LOOKUP_BLOCKED_MESSAGE}
      </p>
    )
  }

  if (display?.status !== 'found') {
    return null
  }

  const stockTextClassName = STOCK_STATE_TEXT_CLASS_NAMES[display.stockState]

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={noticeCard}
    >
      <p
        className={clsx(
          'font-bold',
          'uppercase',
          'tracking-tight',
          stockTextClassName,
        )}
      >
        [{STOCK_STATE_LABELS[display.stockState]}]
      </p>
      <p
        className={clsx(
          'mt-2',
          'text-xl',
          'font-semibold',
          'tracking-tight',
          'text-balance',
          'wrap-break-word',
        )}
      >
        {display.name}
      </p>
      <p className={clsx(noticeCountLine, stockTextClassName)}>
        <span>{LOOKUP_NOTICE_COUNT_LABEL}</span>
        <span aria-hidden="true" className={noticeDots}>
          {LOOKUP_NOTICE_DOT_LEADER}
        </span>
        <span className={noticeCountValue}>{display.quantity}</span>
      </p>
    </div>
  )
}

const LookupCapture = ({
  defaultBarcode = '',
  errorMessage,
  failureMessage,
  holdBarcode,
  display,
}: LookupCaptureProps) => {
  const router = useRouter()

  const handleSubmitBarcode = (barcode: string) => {
    router.push(
      `/inventory/lookup?barcode=${encodeURIComponent(barcode)}`,
      { scroll: false },
    )
  }

  return (
    <main className={clsx(centeredPage, 'relative')}>
      <div className={noticeOverlay}>
        <LookupNotice
          failureMessage={failureMessage}
          display={display}
        />
      </div>
      <div className={clsx('relative', 'w-full', 'max-w-sm')}>
        <BarcodeScanner
          onSubmitBarcode={handleSubmitBarcode}
          defaultBarcode={defaultBarcode}
          errorMessage={errorMessage}
          holdBarcode={holdBarcode}
        />
      </div>
    </main>
  )
}

export { LookupCapture }
