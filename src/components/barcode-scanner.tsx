'use client'

import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { clsx } from 'clsx'

import {
  BarcodeFormat,
  BrowserCodeReader,
  BrowserMultiFormatReader,
} from '@zxing/browser'
import { DecodeHintType } from '@zxing/library'

import { validateBarcode } from '@/lib/items/validate-barcode'

import { Button } from './ui/button'
import { Label } from './ui/label'
import { Input } from './ui/input'

interface BarcodeScannerProps {
  onDetect: (text: string) => void
}

const POSSIBLE_FORMATS = [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
]

const BarcodeScanner = ({ onDetect }: BarcodeScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onDetectEvent = useEffectEvent(onDetect)
  const [cameraError, setCameraError] = useState<string | null>(null)

  useEffect(() => {
    const hints = new Map()

    hints.set(DecodeHintType.POSSIBLE_FORMATS, POSSIBLE_FORMATS)

    const reader = new BrowserMultiFormatReader(hints)

    let controls: { stop: () => void } | undefined
    let hasDetected = false

    const startScan = async () => {
      try {
        const videoInputs = await BrowserCodeReader.listVideoInputDevices()
        const environmentDevice = videoInputs.find((device) =>
          /back|rear|environment/i.test(device.label),
        )
        const deviceId = environmentDevice?.deviceId

        controls = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current ?? undefined,
          (result, _error, scanControls) => {
            if (!result || hasDetected) {
              return
            }

            hasDetected = true
            scanControls.stop()

            const rawText = result.getText()
            const text =
              result.getBarcodeFormat() === BarcodeFormat.UPC_E
                ? (() => {
                    const validationResult = validateBarcode(rawText)
                    return validationResult.status === 'valid'
                      ? validationResult.barcode
                      : rawText
                  })()
                : rawText

            onDetectEvent(text)
          },
        )
      } catch {
        setCameraError(
          'Pict servitor failed. Perform appeasing rituals to calm machine spirit. Provide input manually.',
        )
      }
    }

    void startScan()

    return () => controls?.stop()
  }, [])

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
            defaultValue={''}
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

  return <video ref={videoRef} />
}

export { BarcodeScanner }
