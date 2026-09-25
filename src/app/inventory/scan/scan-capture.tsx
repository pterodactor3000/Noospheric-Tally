'use client'

import { useRouter } from 'next/navigation'

import { BarcodeScanner } from '@/components/barcode-scanner'
import { centeredPage } from '@/app/styles/class-names'

interface ScanCaptureProps {
  defaultBarcode?: string
  errorMessage?: string
}

const ScanCapture = ({
  defaultBarcode = '',
  errorMessage,
}: ScanCaptureProps) => {
  const router = useRouter()

  return (
    <main
      className={centeredPage}
    >
      <BarcodeScanner
        onDetect={(text) => {
          router.push(`/inventory/scan?barcode=${encodeURIComponent(text)}`)
        }}
        defaultBarcode={defaultBarcode}
        errorMessage={errorMessage}
      />
    </main>
  )
}

export { ScanCapture }
