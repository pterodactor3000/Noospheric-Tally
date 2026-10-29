'use client'

import { startTransition, useRef, useState } from 'react'
import { unstable_rethrow, useRouter } from 'next/navigation'
import { clsx } from 'clsx'

import { BarcodeScanner } from '@/components/barcode-scanner'
import { centeredPage } from '@/app/styles/class-names'
import {
  SCAN_DIRECTION_STOCKING,
  SCAN_DIRECTION_USING,
  readScanDirection,
  type ScanDirection,
} from '@/lib/items/scan-direction'

import { stockScannedItem } from '../actions'
import { ScanDirectionButtons } from './scan-direction-buttons'
import { ScanResultNotice } from './scan-result-notice'

interface ScanCaptureResult {
  readonly title: string
  readonly detail: string
  readonly confirmation?: string
  readonly shouldClearAdded?: boolean
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

const ScanCapture = ({
  defaultBarcode = '',
  errorMessage,
  holdBarcode,
  scanResult,
}: ScanCaptureProps) => {
  const router = useRouter()
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' })
  const [scanRound, setScanRound] = useState(0)
  const [noticeGeneration, setNoticeGeneration] = useState(0)
  const isStockSubmitInFlight = useRef(false)

  const handleSubmitBarcode = (barcode: string) => {
    const encodedBarcode = encodeURIComponent(barcode)
    // Resubmitting the held barcode keeps this ScanCapture key, so the scanner
    // needs a new round to restart its one-shot camera. A different barcode
    // changes the key and remounts instead.
    const isSameBarcodeAsHold = barcode === holdBarcode

    if (readSubmitDirection() !== SCAN_DIRECTION_STOCKING) {
      router.push(
        `/inventory/scan?barcode=${encodedBarcode}&direction=${SCAN_DIRECTION_USING}`,
      )
      if (isSameBarcodeAsHold) {
        setScanRound((round) => round + 1)
        setNoticeGeneration((generation) => generation + 1)
      }
      return
    }

    if (isStockSubmitInFlight.current) {
      return
    }

    isStockSubmitInFlight.current = true

    startTransition(async () => {
      try {
        const result = await stockScannedItem(barcode)
        if (result.status === 'error') {
          setSubmitState({
            status: 'failure',
            barcode,
            message: result.message,
          })
        }
      } catch (error: unknown) {
        // A successful stock redirects, which rejects with a redirect error.
        unstable_rethrow(error)
        console.error(`stockScannedItem failed for barcode ${barcode}`, error)
        setSubmitState({
          status: 'failure',
          barcode,
          message: STOCK_SUBMIT_FAILURE_MESSAGE,
        })
      } finally {
        isStockSubmitInFlight.current = false
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
            key={`${noticeGeneration}:${scanResult.title}:${scanResult.detail}`}
            title={scanResult.title}
            detail={scanResult.detail}
            confirmation={scanResult.confirmation}
            shouldClearAdded={scanResult.shouldClearAdded}
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
    </main>
  )
}

export { ScanCapture }
