'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
  const [submitError, setSubmitError] = useState<string | undefined>()
  const [submittedBarcode, setSubmittedBarcode] = useState<string | undefined>()

  const handleSubmitBarcode = async (barcode: string) => {
    const encodedBarcode = encodeURIComponent(barcode)

    if (readSubmitDirection() !== SCAN_DIRECTION_STOCKING) {
      router.push(
        `/inventory/scan?barcode=${encodedBarcode}&direction=${SCAN_DIRECTION_USING}`,
      )
      return
    }

    try {
      const result = await stockScannedItem(barcode)
      // A redirect from the action resolves with no result and navigates.
      if (result?.status === 'error') {
        setSubmittedBarcode(barcode)
        setSubmitError(result.message)
      }
    } catch (error: unknown) {
      console.error(`stockScannedItem failed for barcode ${barcode}`, error)
      setSubmittedBarcode(barcode)
      setSubmitError(STOCK_SUBMIT_FAILURE_MESSAGE)
    }
  }

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
      />
    </main>
  )
}

export { ScanCapture }
