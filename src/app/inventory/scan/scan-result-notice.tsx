'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { clsx } from 'clsx'

const SCAN_RESULT_NOTICE_MS = 5000
const SCAN_RESULT_NOTICE_EXIT_MS = 280

type NoticePhase = 'shown' | 'leaving' | 'hidden'

interface ScanResultNoticeProps {
  title: string
  detail: string
  confirmation?: string
  shouldClearAdded?: boolean
}

const ScanResultNotice = ({
  title,
  detail,
  confirmation,
  shouldClearAdded = false,
}: ScanResultNoticeProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const [phase, setPhase] = useState<NoticePhase>('shown')
  const [latchedConfirmation] = useState(confirmation ?? '')

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
  }, [])

  useEffect(() => {
    if (!shouldClearAdded) {
      return
    }

    const params = new URLSearchParams(window.location.search)
    if (!params.has('added')) {
      return
    }

    params.delete('added')
    const query = params.toString()

    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [shouldClearAdded, pathname, router])

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
        'bg-background',
        'px-4',
        'py-3',
        'font-mono',
        'text-foreground',
        'shadow-lg',
        'shadow-primary/25',
        phase === 'leaving'
          ? 'motion-safe:animate-scan-notice-out'
          : 'motion-safe:animate-scan-notice-in',
      )}
    >
      <p
        className={clsx(
          'text-xl',
          'font-semibold',
          'uppercase',
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
