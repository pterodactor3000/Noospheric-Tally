'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowDown01, ArrowDownAZ } from 'lucide-react'
import { clsx } from 'clsx'

import type { HabUnitTallyLine } from '@/lib/items/load-hab-unit-items'
import { filterItemsByName } from '@/lib/items/filter-items-by-name'
import { sortTallyLines, type TallySort } from '@/lib/items/sort-tally-lines'
import { STOCK_STATE_LABELS, getStockState } from '@/lib/items/stock-state'
import { Button } from '@/components/ui/button'
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

const tallyList = clsx('mt-[1rem]', 'text-[14px]', 'sm:text-[16px]')
const tallyMiss = clsx('mt-[1rem]')
const tallySearchRow = clsx('flex', 'items-center', 'gap-2')
const tallySortGroup = clsx('flex', 'shrink-0', 'gap-2')
const tallyStockLabel = clsx('shrink-0', 'leading-11')
const tallyName = clsx('min-h-11', 'min-w-0', 'truncate', 'leading-11')
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
  const [sort, setSort] = useState<TallySort>('name')

  if (lines.length === 0) {
    return <p>Nothing is added here yet.</p>
  }

  const trimmedQuery = query.trim()
  const visibleLines = sortTallyLines(filterItemsByName(lines, query), sort)

  return (
    <>
      <div className={fieldStack}>
        <Label htmlFor="inventory-name-search" className={fieldLabel}>
          Search by name
        </Label>
        <div className={tallySearchRow}>
          <Input
            type="search"
            id="inventory-name-search"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            className={clsx(fieldControl, 'min-w-0', 'flex-1')}
          />
          <div
            role="radiogroup"
            aria-label="Sort tally"
            className={tallySortGroup}
          >
            <Button
              type="button"
              role="radio"
              aria-checked={sort === 'name'}
              aria-label="Sort by name"
              variant={sort === 'name' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setSort('name')}
              className="size-11!"
            >
              <ArrowDownAZ aria-hidden="true" />
            </Button>
            <Button
              type="button"
              role="radio"
              aria-checked={sort === 'count'}
              aria-label="Sort by count"
              variant={sort === 'count' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setSort('count')}
              className="size-11!"
            >
              <ArrowDown01 aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
      {visibleLines.length === 0 ? (
        <p role="status" className={tallyMiss}>{`No item matches "${trimmedQuery}".`}</p>
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
                  <span
                    className={clsx(
                      tallyStockLabel,
                      STOCK_STATE_TEXT_CLASS_NAMES[stockState],
                    )}
                  >
                    [{STOCK_STATE_LABELS[stockState]}]
                  </span>
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
