'use client'

import { startTransition, useRef, useState } from 'react'
import { unstable_rethrow, useRouter } from 'next/navigation'

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

interface ScanCaptureProps {
  defaultBarcode?: string
  errorMessage?: string
  holdBarcode?: string
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
}: ScanCaptureProps) => {
  const router = useRouter()
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' })
  const [scanRound, setScanRound] = useState(0)
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
    <main
      className={centeredPage}
    >
      <ScanDirectionButtons />
      <BarcodeScanner
        onSubmitBarcode={handleSubmitBarcode}
        defaultBarcode={submittedBarcode ?? defaultBarcode}
        errorMessage={submitError ?? errorMessage}
        holdBarcode={holdBarcode}
        scanRound={scanRound}
      />
    </main>
  )
}

export { ScanCapture }
