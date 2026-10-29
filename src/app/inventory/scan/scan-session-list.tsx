'use client'

import { useEffect, useState } from 'react'
import { clsx } from 'clsx'

import type { ScanSessionLine } from '@/lib/items/load-scan-session-lines'
import { SCAN_SESSION_LOAD_FAILURE_MESSAGE } from '@/lib/items/scan-failure-messages'

import { fetchScanSessionLines } from '../actions'

interface ScanSessionListProps {
  readonly scanSessionId: string | null
  readonly reloadToken: number
}

interface LoadedLinesState {
  readonly status: 'loaded'
  readonly scanSessionId: string
  readonly lines: readonly ScanSessionLine[]
}

interface FailedLinesState {
  readonly status: 'failure'
  readonly scanSessionId: string
  readonly message: string
}

type LinesState = LoadedLinesState | FailedLinesState

const formatQuantityDelta = (quantityDelta: 1 | -1): string =>
  quantityDelta === 1 ? '+1' : '-1'

const ScanSessionList = ({ scanSessionId, reloadToken }: ScanSessionListProps) => {
  const [linesState, setLinesState] = useState<LinesState | null>(null)

  useEffect(() => {
    if (scanSessionId === null) {
      return
    }

    // The cleanup flips this flag, so a response that arrives after a newer
    // request started or after unmount never reaches state.
    let isCurrentRequest = true

    const loadLines = async () => {
      try {
        const result = await fetchScanSessionLines(scanSessionId)
        if (!isCurrentRequest) {
          return
        }
        setLinesState(
          result.status === 'loaded'
            ? { status: 'loaded', scanSessionId, lines: result.lines }
            : { status: 'failure', scanSessionId, message: result.message },
        )
      } catch (error: unknown) {
        console.error('fetchScanSessionLines failed', { scanSessionId, error })
        if (!isCurrentRequest) {
          return
        }
        setLinesState({
          status: 'failure',
          scanSessionId,
          message: SCAN_SESSION_LOAD_FAILURE_MESSAGE,
        })
      }
    }

    void loadLines()

    return () => {
      isCurrentRequest = false
    }
  }, [scanSessionId, reloadToken])

  const currentState =
    scanSessionId !== null && linesState?.scanSessionId === scanSessionId
      ? linesState
      : null
  const lines = currentState?.status === 'loaded' ? currentState.lines : []

  return (
    <section
      aria-label="Scan session"
      className={clsx('w-full', 'max-w-sm', 'px-3', 'pb-6')}
    >
      {currentState?.status === 'failure' ? (
        <p role="alert" className={clsx('text-sm', 'text-destructive')}>
          {currentState.message}
        </p>
      ) : null}
      <ol className={clsx('flex', 'flex-col', 'gap-2')}>
        {lines.map((line) => (
          <li
            key={line.changeId}
            className={clsx('flex', 'items-baseline', 'gap-3', 'text-sm')}
          >
            <span className={clsx('w-8', 'font-mono', 'font-semibold')}>
              {formatQuantityDelta(line.quantityDelta)}
            </span>
            <span className={clsx('flex-1', 'truncate')}>{line.name}</span>
            <span className={clsx('font-mono', 'text-muted-foreground')}>
              {line.barcode}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

export { ScanSessionList }
