'use client'

import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { clsx } from 'clsx'

import {
  BarcodeFormat,
  BrowserCodeReader,
  BrowserMultiFormatOneDReader,
} from '@zxing/browser'
import { DecodeHintType } from '@zxing/library'

import { validateBarcode } from '@/lib/items/validate-barcode'

import { Button } from './ui/button'
import { Label } from './ui/label'
import { Input } from './ui/input'

interface BarcodeScannerProps {
  onDetect: (text: string) => void
  defaultBarcode?: string
  errorMessage?: string
}

const POSSIBLE_FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
]

const BarcodeScanner = ({
  onDetect,
  defaultBarcode = '',
  errorMessage,
}: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onDetectEvent = useEffectEvent(onDetect)
  const [cameraError, setCameraError] = useState<string | null>(
    errorMessage ?? null,
  )

  useEffect(() => {
    if (errorMessage) {
      return
    }

    const hints = new Map<DecodeHintType, unknown>()

    hints.set(DecodeHintType.POSSIBLE_FORMATS, POSSIBLE_FORMATS)

    // BrowserMultiFormatReader logs NotFoundException on every empty frame
    // in @zxing/library 0.23. Product barcodes are 1D.
    const reader = new BrowserMultiFormatOneDReader(hints)

    let controls: { stop: () => void } | undefined
    let hasDetected = false
    let isDisposed = false

    const startScan = async () => {
      try {
        const videoInputs = await BrowserCodeReader.listVideoInputDevices()
        const environmentDevice = videoInputs.find((device) =>
          /back|rear|environment/i.test(device.label),
        )
        const deviceId = environmentDevice?.deviceId

        const nextControls = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current ?? undefined,
          (result, _error, scanControls) => {
            if (isDisposed || !result || hasDetected) {
              return
            }

            hasDetected = true
            scanControls.stop()

            const rawText = result.getText()
            const text =
              result.getBarcodeFormat() === BarcodeFormat.UPC_E
                ? (() => {
                    const validationResult = validateBarcode(rawText, {
                      isUpcE: true,
                    })
                    return validationResult.status === 'valid'
                      ? validationResult.barcode
                      : rawText
                  })()
                : rawText

            onDetectEvent(text)
          },
        )
        if (isDisposed) {
          nextControls.stop()
          return
        }

        controls = nextControls
      } catch (error) {
        if (isDisposed) {
          return
        }

        console.error('decodeFromVideoDevice failed', error)
        setCameraError(
          'Pict servitor failed. Perform appeasing rituals to calm machine spirit. Provide input manually.',
        )
      }
    }

    void startScan()

    return () => {
      isDisposed = true
      controls?.stop()
    }
  }, [errorMessage])

  if (cameraError) {
    return (
      <form
        action="/inventory/scan"
        method="get"
        className={clsx('mt-8', 'flex', 'flex-col', 'gap-4')}
      >
        <div
          role="alert"
          aria-live="polite"
          className={clsx(
            'min-h-6',
            'text-sm',
            'text-red-700',
            'font-mono',
            'font-semibold',
          )}
        >
          {cameraError}
        </div>
        <div className={clsx('flex', 'flex-col', 'gap-2')}>
          <Label
            htmlFor="barcode"
            className={clsx('text-sm', 'font-medium', 'font-mono')}
          >
            Barcode
          </Label>
          <Input
            type="text"
            id="barcode"
            name="barcode"
            inputMode="numeric"
            autoComplete="off"
            required
            defaultValue={defaultBarcode}
            aria-invalid={Boolean(cameraError)}
            className={clsx('min-h-11', 'text-base', 'font-mono')}
          />
        </div>
        <Button
          variant="outline"
          type="submit"
          className={clsx('font-mono', 'min-h-11', 'w-full')}
        >
          Apply
        </Button>
      </form>
    )
  }

  return (
    <section
      className={clsx(
        'relative',
        'mx-auto',
        'aspect-3/4',
        'w-full',
        'max-w-sm',
        'overflow-hidden',
        'bg-black',
      )}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        className={clsx('absolute', 'inset-0', 'h-full', 'w-full', 'object-cover')}
      />
      <div className={clsx('pointer-events-none', 'absolute', 'inset-0')}>
        <div
          className={clsx(
            'absolute',
            'top-1/2',
            'left-1/2',
            'h-28',
            'w-[86%]',
            '-translate-x-1/2',
            '-translate-y-1/2',
            'shadow-[0_0_0_999px_rgb(0_0_0/0.55)]',
          )}
        >
          <span
            className={clsx(
              'absolute',
              '-top-px',
              '-left-px',
              'size-5',
              'border-t-2',
              'border-l-2',
              'border-ring',
            )}
          />
          <span
            className={clsx(
              'absolute',
              '-top-px',
              '-right-px',
              'size-5',
              'border-t-2',
              'border-r-2',
              'border-ring',
            )}
          />
          <span
            className={clsx(
              'absolute',
              '-bottom-px',
              '-left-px',
              'size-5',
              'border-b-2',
              'border-l-2',
              'border-ring',
            )}
          />
          <span
            className={clsx(
              'absolute',
              '-right-px',
              '-bottom-px',
              'size-5',
              'border-r-2',
              'border-b-2',
              'border-ring',
            )}
          />
          <span
            className={clsx(
              'absolute',
              'inset-x-3',
              'top-1/2',
              'h-0.5',
              'bg-ring',
              'motion-safe:animate-scan-line',
            )}
          />
        </div>
        <p
          className={clsx(
            'absolute',
            'inset-x-4',
            'bottom-6',
            'text-center',
            'font-mono',
            'text-sm',
            'text-white',
          )}
        >
          Align the barcode in the frame
        </p>
      </div>
    </section>
  )
}

export { BarcodeScanner }
