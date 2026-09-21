'use client'

import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'

import { BarcodeScanner } from '@/components/barcode-scanner'

const ScanCapture = () => {
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
      />
    </main>
  )
}

export { ScanCapture }
