'use client'

import { startTransition, useRef, useState, useSyncExternalStore } from 'react'
import { unstable_rethrow } from 'next/navigation'
import { clsx } from 'clsx'

import { BarcodeScanner } from '@/components/barcode-scanner'
import { centeredPage } from '@/app/styles/class-names'
import {
  SCAN_DIRECTION_STOCKING,
  SCAN_DIRECTION_USING,
  readScanDirection,
  type ScanDirection,
} from '@/lib/items/scan-direction'
import {
  SCAN_SESSION_STORAGE_KEY,
  ensureScanSessionId,
  readScanSessionId,
  type ScanSessionStorage,
} from '@/lib/items/scan-session'

import { consumeScannedItem, stockScannedItem } from '../actions'
import { ScanDirectionButtons } from './scan-direction-buttons'
import { ScanResultNotice } from './scan-result-notice'
import { ScanSessionList } from './scan-session-list'

interface ScanCaptureResult {
  readonly title: string
  readonly detail: string
  readonly confirmation?: string
  readonly clearParam?: 'added' | 'removed' | 'floor'
}

interface ScanCaptureProps {
  defaultBarcode?: string
  errorMessage?: string
  holdBarcode?: string
  scanResult?: ScanCaptureResult
}

const STOCK_SUBMIT_FAILURE_MESSAGE =
  'Item write failed. Purify the Machine Spirit and try again.'

interface IdleSubmitState {
  readonly status: 'idle'
}

interface FailedSubmitState {
  readonly status: 'failure'
  readonly barcode: string
  readonly message: string
}

type SubmitState = IdleSubmitState | FailedSubmitState

const readSubmitDirection = (): ScanDirection => {
  try {
    return readScanDirection(window.sessionStorage)
  } catch {
    return SCAN_DIRECTION_USING
  }
}

const createInMemoryScanSessionStorage = (): ScanSessionStorage => {
  const values = new Map<string, string>()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
  }
}

// Used for the life of the page when sessionStorage throws.
const fallbackScanSessionStorage = createInMemoryScanSessionStorage()

let hasLoggedScanSessionStorageFailure = false

const scanSessionListeners = new Set<() => void>()

const subscribeToScanSessionId = (listener: () => void) => {
  scanSessionListeners.add(listener)
  return () => {
    scanSessionListeners.delete(listener)
  }
}

const notifyScanSessionIdListeners = () => {
  scanSessionListeners.forEach((listener) => listener())
}

// Reads only. The id is minted inside a submit, never by a render.
const getScanSessionIdSnapshot = (): string | null => {
  try {
    return readScanSessionId(window.sessionStorage)
  } catch {
    return readScanSessionId(fallbackScanSessionStorage)
  }
}

const getScanSessionIdServerSnapshot = (): string | null => null

const ensureSubmitScanSessionId = (): string => {
  const createId = () => crypto.randomUUID()
  try {
    return ensureScanSessionId(window.sessionStorage, createId)
  } catch (error) {
    if (!hasLoggedScanSessionStorageFailure) {
      hasLoggedScanSessionStorageFailure = true
      console.error(
        `ensureScanSessionId failed for storage key ${SCAN_SESSION_STORAGE_KEY}`,
        error,
      )
    }
    return ensureScanSessionId(fallbackScanSessionStorage, createId)
  }
}

const ScanCapture = ({
  defaultBarcode = '',
  errorMessage,
  holdBarcode,
  scanResult,
}: ScanCaptureProps) => {
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' })
  const [scanRound, setScanRound] = useState(0)
  const isScanSubmitInFlight = useRef(false)
  const scanSessionId = useSyncExternalStore(
    subscribeToScanSessionId,
    getScanSessionIdSnapshot,
    getScanSessionIdServerSnapshot,
  )

  const handleSubmitBarcode = (barcode: string) => {
    // Resubmitting the held barcode keeps this ScanCapture key, so the scanner
    // needs a new round to restart its one-shot camera. A different barcode
    // changes the key and remounts instead.
    const isSameBarcodeAsHold = barcode === holdBarcode
    const direction = readSubmitDirection()

    if (isScanSubmitInFlight.current) {
      return
    }

    isScanSubmitInFlight.current = true

    startTransition(async () => {
      try {
        const submitScanSessionId = ensureSubmitScanSessionId()
        notifyScanSessionIdListeners()
        const result =
          direction === SCAN_DIRECTION_STOCKING
            ? await stockScannedItem(barcode, submitScanSessionId)
            : await consumeScannedItem(barcode, submitScanSessionId)
        if (result.status === 'error') {
          setSubmitState({
            status: 'failure',
            barcode,
            message: result.message,
          })
        }
      } catch (error: unknown) {
        // A successful scan redirects, which rejects with a redirect error.
        unstable_rethrow(error)
        const actionName =
          direction === SCAN_DIRECTION_STOCKING
            ? 'stockScannedItem'
            : 'consumeScannedItem'
        console.error(`${actionName} failed for barcode ${barcode}`, error)
        setSubmitState({
          status: 'failure',
          barcode,
          message: STOCK_SUBMIT_FAILURE_MESSAGE,
        })
      } finally {
        isScanSubmitInFlight.current = false
        if (isSameBarcodeAsHold) {
          setScanRound((round) => round + 1)
        }
      }
    })
  }

  const submittedBarcode =
    submitState.status === 'failure' ? submitState.barcode : undefined
  const submitError =
    submitState.status === 'failure' ? submitState.message : undefined

  return (
    <main className={clsx(centeredPage, 'relative')}>
      <div
        className={clsx(
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
        )}
      >
        {scanResult ? (
          <ScanResultNotice
            key={`${scanResult.title}:${scanResult.detail}`}
            title={scanResult.title}
            detail={scanResult.detail}
            confirmation={scanResult.confirmation}
            clearParam={scanResult.clearParam}
          />
        ) : null}
      </div>
      <div className={clsx('relative', 'w-full', 'max-w-sm')}>
        <div
          className={clsx(
            'pointer-events-auto',
            'absolute',
            'top-[calc(25%-2.75rem)]',
            'left-1/2',
            'z-20',
            '-translate-x-1/2',
          )}
        >
          <ScanDirectionButtons />
        </div>
        <BarcodeScanner
          onSubmitBarcode={handleSubmitBarcode}
          defaultBarcode={submittedBarcode ?? defaultBarcode}
          errorMessage={submitError ?? errorMessage}
          holdBarcode={holdBarcode}
          scanRound={scanRound}
        />
      </div>
      <ScanSessionList scanSessionId={scanSessionId} reloadToken={scanRound} />
    </main>
  )
}

export { ScanCapture }
export type { ScanCaptureResult }
