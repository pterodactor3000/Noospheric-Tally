'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { clsx } from 'clsx'

import { STOCK_STATE_TEXT_CLASS_NAMES } from '@/app/styles/stock-state-class-names'
import { STOCK_STATE_LABELS, type StockState } from '@/lib/items/stock-state'

const SCAN_RESULT_NOTICE_MS = 5000
const SCAN_RESULT_NOTICE_EXIT_MS = 280
const SCAN_NOTICE_DOT_LEADER = '.'.repeat(300)
const SCAN_NOTICE_COUNT_LABEL = 'Count'

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

const hasStatusLabel = (stockState: StockState): boolean =>
  stockState === 'warning' || stockState === 'critical'

type NoticePhase = 'shown' | 'leaving' | 'hidden'

interface ScanResultNoticeProps {
  title: string
  detail: string
  stockState: StockState
  confirmation?: string
  clearParam?: 'added' | 'removed' | 'floor'
}

const ScanResultNotice = ({
  title,
  detail,
  stockState,
  confirmation,
  clearParam,
}: ScanResultNoticeProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const [phase, setPhase] = useState<NoticePhase>('shown')
  const [latchedConfirmation, setLatchedConfirmation] = useState(
    confirmation ?? '',
  )
  const [previousConfirmation, setPreviousConfirmation] = useState(confirmation)
  const [showCount, setShowCount] = useState(0)

  // A repeated scan can yield the same title and detail, so the notice keeps
  // its key. Restart it whenever a confirmation appears while mounted.
  if (confirmation !== previousConfirmation) {
    setPreviousConfirmation(confirmation)
    if (confirmation && !previousConfirmation) {
      setLatchedConfirmation(confirmation)
      setPhase('shown')
      setShowCount((count) => count + 1)
    }
  }

  useEffect(() => {
    const exitTimer = window.setTimeout(() => {
      setPhase('leaving')
    }, SCAN_RESULT_NOTICE_MS - SCAN_RESULT_NOTICE_EXIT_MS)

    const hideTimer = window.setTimeout(() => {
      setPhase('hidden')
    }, SCAN_RESULT_NOTICE_MS)

    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(hideTimer)
    }
  }, [showCount])

  useEffect(() => {
    if (!clearParam) {
      return
    }

    const params = new URLSearchParams(window.location.search)
    if (!params.has(clearParam)) {
      return
    }

    params.delete(clearParam)
    const query = params.toString()

    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [clearParam, pathname, router])

  if (phase === 'hidden') {
    return null
  }

  const showsStatusLabel = hasStatusLabel(stockState)
  const statusTextClassName = showsStatusLabel
    ? STOCK_STATE_TEXT_CLASS_NAMES[stockState]
    : undefined

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={clsx(
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
        phase === 'leaving'
          ? 'motion-safe:animate-scan-notice-out'
          : 'motion-safe:animate-scan-notice-in',
      )}
    >
      {showsStatusLabel ? (
        <p
          className={clsx(
            'font-bold',
            'uppercase',
            'tracking-tight',
            statusTextClassName,
          )}
        >
          [{STOCK_STATE_LABELS[stockState]}]
        </p>
      ) : null}
      <p
        className={clsx(
          showsStatusLabel && 'mt-2',
          'text-xl',
          'font-semibold',
          'tracking-tight',
          'text-balance',
          'wrap-break-word',
        )}
      >
        {title}
      </p>
      <p className={clsx(noticeCountLine, statusTextClassName)}>
        <span>{SCAN_NOTICE_COUNT_LABEL}</span>
        <span aria-hidden="true" className={noticeDots}>
          {SCAN_NOTICE_DOT_LEADER}
        </span>
        <span className={noticeCountValue}>{detail}</span>
      </p>
      {latchedConfirmation ? (
        <p
          className={clsx(
            'mt-2',
            'text-sm',
            'leading-6',
            'text-pretty',
            'wrap-break-word',
          )}
        >
          {latchedConfirmation}
        </p>
      ) : null}
    </div>
  )
}

export { ScanResultNotice }
export type { ScanResultNoticeProps }
