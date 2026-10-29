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
import {
  fieldControl,
  fieldLabel,
  fieldStack,
  formError,
  formStack,
  fullWidthButton,
} from '@/app/styles/class-names'
import { Label } from './ui/label'
import { Input } from './ui/input'

interface BarcodeScannerProps {
  onSubmitBarcode: (barcode: string) => void | Promise<void>
  defaultBarcode?: string
  errorMessage?: string
  holdBarcode?: string
  scanRound?: number
}

const HOLD_MISS_DURATION_MS = 500
// Poll faster than the hold length so a steady hold keeps resetting the miss timer.
const SCAN_DELAY_MS = 100

const POSSIBLE_FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
]

const BarcodeScanner = ({
  onSubmitBarcode,
  defaultBarcode = '',
  errorMessage,
  holdBarcode,
  scanRound = 0,
}: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onSubmitBarcodeEvent = useEffectEvent(onSubmitBarcode)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const displayedError = errorMessage ?? cameraError

  useEffect(() => {
    if (errorMessage) {
      return
    }

    const hints = new Map<DecodeHintType, unknown>()

    hints.set(DecodeHintType.POSSIBLE_FORMATS, POSSIBLE_FORMATS)

    // BrowserMultiFormatReader logs NotFoundException on every empty frame
    // in @zxing/library 0.23. Product barcodes are 1D.
    const reader = new BrowserMultiFormatOneDReader(hints, {
      delayBetweenScanAttempts: SCAN_DELAY_MS,
      delayBetweenScanSuccess: SCAN_DELAY_MS,
    })

    let controls: { stop: () => void } | undefined
    // scanRound is a dependency only: a new round creates a fresh reader and
    // resets hasSubmitted and the hold.
    void scanRound
    let hasSubmitted = false
    let isDisposed = false
    let isHeld = holdBarcode !== undefined
    let missTimer: ReturnType<typeof setTimeout> | undefined

    // The hold releases only after HOLD_MISS_DURATION_MS with no decode of the
    // held code. The timer is first armed on the first reader callback, so
    // camera startup cannot expire it. Empty frames never reset or release it.
    const armMissTimer = () => {
      clearTimeout(missTimer)
      missTimer = setTimeout(() => {
        isHeld = false
        missTimer = undefined
      }, HOLD_MISS_DURATION_MS)
    }

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
            if (isDisposed || hasSubmitted) {
              return
            }

            if (isHeld && missTimer === undefined) {
              armMissTimer()
            }

            if (!result) {
              return
            }

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

            if (isHeld && text === holdBarcode) {
              armMissTimer()
              return
            }

            hasSubmitted = true
            clearTimeout(missTimer)
            scanControls.stop()

            void onSubmitBarcodeEvent(text)
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
      clearTimeout(missTimer)
      controls?.stop()
    }
  }, [errorMessage, holdBarcode, scanRound])

  if (displayedError) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault()
          const barcode = new FormData(event.currentTarget).get('barcode')
          if (typeof barcode !== 'string') {
            return
          }
          void onSubmitBarcode(barcode)
        }}
        className={clsx(formStack, 'pt-24')}
      >
        <div
          role="alert"
          aria-live="polite"
          className={formError}
        >
          {displayedError}
        </div>
        <div className={fieldStack}>
          <Label
            htmlFor="barcode"
            className={fieldLabel}
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
            aria-invalid={Boolean(displayedError)}
            className={fieldControl}
          />
        </div>
        <Button
          variant="outline"
          type="submit"
          className={fullWidthButton}
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
