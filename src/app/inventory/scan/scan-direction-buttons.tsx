'use client'

import { useSyncExternalStore } from 'react'

import { Button } from '@/components/ui/button'
import {
  SCAN_DIRECTION_STOCKING,
  SCAN_DIRECTION_USING,
  readScanDirection,
  writeScanDirection,
  type ScanDirection,
} from '@/lib/items/scan-direction'

const SCAN_DIRECTIONS: readonly ScanDirection[] = [
  SCAN_DIRECTION_USING,
  SCAN_DIRECTION_STOCKING,
]

const scanDirectionListeners = new Set<() => void>()

const subscribeToScanDirection = (listener: () => void) => {
  scanDirectionListeners.add(listener)
  return () => {
    scanDirectionListeners.delete(listener)
  }
}

const getScanDirectionSnapshot = (): ScanDirection =>
  readScanDirection(window.sessionStorage)

const getScanDirectionServerSnapshot = (): ScanDirection => SCAN_DIRECTION_USING

const ScanDirectionButtons = () => {
  const selectedDirection = useSyncExternalStore(
    subscribeToScanDirection,
    getScanDirectionSnapshot,
    getScanDirectionServerSnapshot,
  )

  const handleSelectDirection = (direction: ScanDirection) => {
    writeScanDirection(window.sessionStorage, direction)
    scanDirectionListeners.forEach((listener) => listener())
  }

  return (
    <div role="radiogroup" aria-label="Scan direction" className="flex gap-2">
      {SCAN_DIRECTIONS.map((direction) => {
        const isSelected = direction === selectedDirection

        return (
          <Button
            key={direction}
            type="button"
            role="radio"
            aria-checked={isSelected}
            variant={isSelected ? 'default' : 'outline'}
            onClick={() => handleSelectDirection(direction)}
          >
            {direction}
          </Button>
        )
      })}
    </div>
  )
}

export { ScanDirectionButtons }
