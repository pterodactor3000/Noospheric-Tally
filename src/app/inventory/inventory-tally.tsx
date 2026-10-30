'use client'

import { useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'

import type { HabUnitTallyLine } from '@/lib/items/load-hab-unit-items'
import { filterItemsByName } from '@/lib/items/filter-items-by-name'
import { STOCK_STATE_LABELS, getStockState } from '@/lib/items/stock-state'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  fieldControl,
  fieldLabel,
  fieldStack,
} from '@/app/styles/class-names'
import { STOCK_STATE_TEXT_CLASS_NAMES } from '@/app/styles/stock-state-class-names'

import TallyCountControls from './tally-count-controls'

const TALLY_DOT_LEADER = '.'.repeat(300)

const tallyList = clsx('text-[14px]', 'sm:text-[16px]')
const tallyName = clsx(
  'min-h-11',
  'min-w-0',
  'truncate',
  'leading-11',
  'text-inherit',
)
const tallyDots = clsx(
  'min-w-0',
  'flex-1',
  'overflow-hidden',
  'whitespace-nowrap',
)

interface InventoryTallyProps {
  readonly lines: readonly HabUnitTallyLine[]
}

const InventoryTally = ({ lines }: InventoryTallyProps) => {
  const [query, setQuery] = useState('')

  if (lines.length === 0) {
    return <p>Nothing is added here yet.</p>
  }

  const trimmedQuery = query.trim()
  const visibleLines = filterItemsByName(lines, query)

  return (
    <>
      <div className={fieldStack}>
        <Label htmlFor="inventory-name-search" className={fieldLabel}>
          Search by name
        </Label>
        <Input
          type="search"
          id="inventory-name-search"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          className={fieldControl}
        />
      </div>
      {visibleLines.length === 0 ? (
        <p role="status">{`No item matches "${trimmedQuery}".`}</p>
      ) : (
        <ul className={tallyList}>
          {visibleLines.map((line) => {
            const stockState = getStockState(
              line.quantity,
              line.minimumQuantity,
            )

            return (
              <li key={line.itemId} className="px-2">
                <TallyCountControls
                  itemId={line.itemId}
                  name={line.name}
                  quantity={line.quantity}
                  stockStateLabel={STOCK_STATE_LABELS[stockState]}
                  stockTextClassName={STOCK_STATE_TEXT_CLASS_NAMES[stockState]}
                >
                  <Link
                    href={`/inventory/${line.itemId}`}
                    className={tallyName}
                  >
                    {line.name}
                  </Link>
                  <span aria-hidden="true" className={tallyDots}>
                    {TALLY_DOT_LEADER}
                  </span>
                </TallyCountControls>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}

export default InventoryTally
