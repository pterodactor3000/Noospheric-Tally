'use client'

import { useSyncExternalStore } from 'react'
import { PackageMinus, PackagePlus, type LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  SCAN_DIRECTION_STOCKING,
  SCAN_DIRECTION_STORAGE_KEY,
  SCAN_DIRECTION_USING,
  readScanDirection,
  writeScanDirection,
  type ScanDirection,
} from '@/lib/items/scan-direction'

const SCAN_DIRECTIONS: readonly ScanDirection[] = [
  SCAN_DIRECTION_USING,
  SCAN_DIRECTION_STOCKING,
]

const SCAN_DIRECTION_ICONS: Record<ScanDirection, LucideIcon> = {
  [SCAN_DIRECTION_USING]: PackageMinus,
  [SCAN_DIRECTION_STOCKING]: PackagePlus,
}

const scanDirectionListeners = new Set<() => void>()

let hasLoggedScanDirectionReadFailure = false

const subscribeToScanDirection = (listener: () => void) => {
  scanDirectionListeners.add(listener)
  try {
    window.sessionStorage.getItem(SCAN_DIRECTION_STORAGE_KEY)
  } catch (error) {
    if (!hasLoggedScanDirectionReadFailure) {
      hasLoggedScanDirectionReadFailure = true
      console.error(
        `readScanDirection failed for storage key ${SCAN_DIRECTION_STORAGE_KEY}`,
        error,
      )
    }
  }
  return () => {
    scanDirectionListeners.delete(listener)
  }
}

const getScanDirectionSnapshot = (): ScanDirection => {
  try {
    return readScanDirection(window.sessionStorage)
  } catch {
    return SCAN_DIRECTION_USING
  }
}

const getScanDirectionServerSnapshot = (): ScanDirection => SCAN_DIRECTION_USING

const ScanDirectionButtons = () => {
  const selectedDirection = useSyncExternalStore(
    subscribeToScanDirection,
    getScanDirectionSnapshot,
    getScanDirectionServerSnapshot,
  )

  const handleSelectDirection = (direction: ScanDirection) => {
    try {
      writeScanDirection(window.sessionStorage, direction)
    } catch (error) {
      console.error(
        `writeScanDirection failed for storage key ${SCAN_DIRECTION_STORAGE_KEY} and direction ${direction}`,
        error,
      )
      return
    }
    scanDirectionListeners.forEach((listener) => listener())
  }

  return (
    <div role="radiogroup" aria-label="Scan direction" className="flex gap-2">
      {SCAN_DIRECTIONS.map((direction) => {
        const isSelected = direction === selectedDirection
        const DirectionIcon = SCAN_DIRECTION_ICONS[direction]

        return (
          <Button
            key={direction}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={direction}
            variant={isSelected ? 'default' : 'outline'}
            size="icon"
            onClick={() => handleSelectDirection(direction)}
            className="size-17! p-3"
          >
            <DirectionIcon className="size-10" aria-hidden="true" />
          </Button>
        )
      })}
    </div>
  )
}

export { ScanDirectionButtons }
