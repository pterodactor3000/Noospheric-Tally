'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { clsx } from 'clsx'

import { STOCK_STATE_CLASS_NAMES } from '@/app/styles/stock-state-class-names'
import { STOCK_STATE_LABELS, type StockState } from '@/lib/items/stock-state'

const SCAN_RESULT_NOTICE_MS = 5000
const SCAN_RESULT_NOTICE_EXIT_MS = 280

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

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={clsx(
        'pointer-events-auto',
        'border-2',
        'border-ring',
        'px-4',
        'py-3',
        'font-mono',
        STOCK_STATE_CLASS_NAMES[stockState],
        'shadow-lg',
        'shadow-primary/25',
        phase === 'leaving'
          ? 'motion-safe:animate-scan-notice-out'
          : 'motion-safe:animate-scan-notice-in',
      )}
    >
      <span className="sr-only">{STOCK_STATE_LABELS[stockState]}</span>
      <p
        className={clsx(
          'text-xl',
          'font-semibold',
          'tracking-tight',
          'text-balance',
          'wrap-break-word',
        )}
      >
        {title}
      </p>
      <p
        className={clsx(
          'mt-2',
          'text-base',
          'leading-6',
          'text-pretty',
          'wrap-break-word',
        )}
      >
        {detail}
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
