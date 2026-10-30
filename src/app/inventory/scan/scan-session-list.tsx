'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'

import { ItemListMarker } from '@/components/item-list-marker'
import { Button } from '@/components/ui/button'
import type { ScanSessionLine } from '@/lib/items/load-scan-session-lines'
import {
  ITEM_WRITE_FAILURE_MESSAGE,
  SCAN_SESSION_LOAD_FAILURE_MESSAGE,
} from '@/lib/items/scan-failure-messages'

import { fetchScanSessionLines, reverseScanSessionLine } from '../actions'

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

interface ReversalFailure {
  readonly changeId: string
  readonly message: string
  // The reloadToken that was current when the failure was stored.
  readonly reloadToken: number
}

const formatQuantityDelta = (quantityDelta: 1 | -1): string =>
  quantityDelta === 1 ? '+1' : '-1'

const requestLinesState = async (scanSessionId: string): Promise<LinesState> => {
  try {
    const result = await fetchScanSessionLines(scanSessionId)
    return result.status === 'loaded'
      ? { status: 'loaded', scanSessionId, lines: result.lines }
      : { status: 'failure', scanSessionId, message: result.message }
  } catch (error: unknown) {
    console.error('fetchScanSessionLines failed', { scanSessionId, error })
    return {
      status: 'failure',
      scanSessionId,
      message: SCAN_SESSION_LOAD_FAILURE_MESSAGE,
    }
  }
}

const ScanSessionList = ({ scanSessionId, reloadToken }: ScanSessionListProps) => {
  const router = useRouter()
  const [linesState, setLinesState] = useState<LinesState | null>(null)
  const [pendingChangeId, setPendingChangeId] = useState<string | null>(null)
  const [reversalFailure, setReversalFailure] =
    useState<ReversalFailure | null>(null)
  // Read only inside handlers and async responses, never during render.
  const isReversalInFlight = useRef(false)
  // A newer request, from a reload or a reversal, supersedes an older response.
  const latestRequestNumber = useRef(0)

  useEffect(() => {
    if (scanSessionId === null) {
      return
    }

    // The cleanup flips this flag, so a response that arrives after unmount or
    // after the session id changed never reaches state.
    let isCurrentEffect = true
    latestRequestNumber.current += 1
    const requestNumber = latestRequestNumber.current

    const loadLines = async () => {
      const nextState = await requestLinesState(scanSessionId)
      if (!isCurrentEffect || latestRequestNumber.current !== requestNumber) {
        return
      }
      setLinesState(nextState)
    }

    void loadLines()

    return () => {
      isCurrentEffect = false
    }
  }, [scanSessionId, reloadToken])

  const reverseLine = async (changeId: string, lineSessionId: string) => {
    try {
      const result = await reverseScanSessionLine(changeId)
      if (result.status === 'error') {
        setReversalFailure({
          changeId,
          message: result.message,
          reloadToken,
        })
        return
      }

      latestRequestNumber.current += 1
      const requestNumber = latestRequestNumber.current
      const nextState = await requestLinesState(lineSessionId)
      if (latestRequestNumber.current === requestNumber) {
        setLinesState(nextState)
      }
      router.refresh()
    } catch (error: unknown) {
      console.error('reverseScanSessionLine failed', { changeId, error })
      setReversalFailure({
        changeId,
        message: ITEM_WRITE_FAILURE_MESSAGE,
        reloadToken,
      })
    } finally {
      isReversalInFlight.current = false
      setPendingChangeId(null)
    }
  }

  const handleUndo = (changeId: string, lineSessionId: string) => {
    if (isReversalInFlight.current) {
      return
    }

    isReversalInFlight.current = true
    setPendingChangeId(changeId)
    setReversalFailure(null)
    void reverseLine(changeId, lineSessionId)
  }

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
        <p
          role="alert"
          className={clsx(
            'text-sm',
            'text-destructive',
            'motion-safe:animate-form-alert-in',
          )}
        >
          {currentState.message}
        </p>
      ) : null}
      {reversalFailure && reversalFailure.reloadToken === reloadToken ? (
        <p
          role="alert"
          className={clsx(
            'text-sm',
            'text-destructive',
            'motion-safe:animate-form-alert-in',
          )}
        >
          {reversalFailure.message}
        </p>
      ) : null}
      <ol className={clsx('flex', 'flex-col', 'gap-2')}>
        {lines.map((line) => (
          <li
            key={line.changeId}
            className={clsx('flex', 'items-center', 'gap-3', 'text-sm')}
          >
            <ItemListMarker />
            <span className={clsx('w-8', 'font-mono', 'font-semibold')}>
              {formatQuantityDelta(line.quantityDelta)}
            </span>
            <span className={clsx('flex-1', 'truncate')}>{line.name}</span>
            <span className={clsx('font-mono', 'text-muted-foreground')}>
              {line.barcode}
            </span>
            {line.isReversed ? (
              <span className={clsx('text-muted-foreground')}>reversed</span>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={`Undo ${formatQuantityDelta(line.quantityDelta)} ${line.name} ${line.barcode}`}
                disabled={pendingChangeId !== null}
                onClick={() => {
                  if (scanSessionId === null) {
                    return
                  }
                  handleUndo(line.changeId, scanSessionId)
                }}
              >
                Undo
              </Button>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}

export { ScanSessionList }
