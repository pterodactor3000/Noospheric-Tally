'use client'

import { useState } from 'react'
import { clsx } from 'clsx'

import {
  getBarcodeLineText,
  NO_BARCODE_SUPPLIED_TEXT,
} from '@/lib/items/get-barcode-line-text'

const itemControl = clsx(
  'min-h-11',
  'min-w-11',
  'border-0',
  'bg-transparent',
  'p-0',
  'font-[inherit]',
  'text-[length:inherit]',
  'leading-[inherit]',
  'text-inherit',
  'no-underline',
  'disabled:text-inherit',
  'disabled:opacity-100',
)

interface BarcodeLineProps {
  readonly barcodes: readonly string[]
}

const BarcodeLine = ({ barcodes }: BarcodeLineProps) => {
  const [isPinned, setIsPinned] = useState(false)
  const [isPreviewed, setIsPreviewed] = useState(false)

  if (barcodes.length > 0) {
    return <span className="min-w-0">{getBarcodeLineText(barcodes, false)}</span>
  }

  const isRevealed = isPinned || isPreviewed

  return (
    <button
      type="button"
      aria-label={NO_BARCODE_SUPPLIED_TEXT}
      className={clsx(itemControl, 'text-left')}
      onMouseEnter={() => setIsPreviewed(true)}
      onMouseLeave={() => setIsPreviewed(false)}
      onFocus={() => setIsPreviewed(true)}
      onBlur={() => setIsPreviewed(false)}
      onClick={() => {
        if (isPinned) {
          setIsPreviewed(false)
        }
        setIsPinned((current) => !current)
      }}
    >
      {getBarcodeLineText([], isRevealed)}
    </button>
  )
}

export { BarcodeLine, itemControl }
