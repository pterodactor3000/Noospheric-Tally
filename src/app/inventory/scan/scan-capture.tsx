'use client'

import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'

import { BarcodeScanner } from '@/components/barcode-scanner'

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
      className={clsx(
        'flex',
        'flex-col',
        'min-h-screen',
        'items-center',
        'justify-center',
        'px-6',
      )}
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
