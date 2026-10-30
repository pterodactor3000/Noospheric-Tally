'use client'

import { useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'

import type { RestockLine } from '@/lib/items/rank-restock-lines'
import { getCategoryShortage } from '@/lib/items/get-category-shortage'
import { groupTallyLinesByCategory } from '@/lib/items/group-tally-lines-by-category'
import {
  ITEM_CATEGORY_LABELS,
  type ItemCategory,
} from '@/lib/items/item-category'
import { resolveCategoryPanelOpen } from '@/lib/items/resolve-category-panel-open'
import { STOCK_STATE_TEXT_CLASS_NAMES } from '@/app/styles/stock-state-class-names'
import { ItemListMarker } from '@/components/item-list-marker'

import InventoryCategoryPanel from '../inventory-category-panel'

const RESTOCK_DOT_LEADER = '.'.repeat(300)

const restockStack = clsx('mt-[1rem]', 'text-[14px]', 'sm:text-[16px]')
const restockLine = clsx('flex', 'items-baseline', 'gap-2')
const restockName = clsx(
  'min-h-[36px]',
  'min-w-0',
  'truncate',
  'leading-[36px]',
  'text-inherit',
)
const restockDots = clsx(
  'min-w-0',
  'flex-1',
  'overflow-hidden',
  'whitespace-nowrap',
)
const restockValue = clsx('shrink-0', 'whitespace-nowrap')
const restockWideValue = clsx(restockValue, 'max-sm:hidden')
const restockNarrowLine = clsx(restockLine, 'sm:hidden')

interface RestockListProps {
  readonly lines: readonly RestockLine[]
}

interface RestockLineRowProps {
  readonly line: RestockLine
}

const formatRestockEnd = (quantity: number, shortfall: number): string =>
  `${quantity} // [${shortfall} short]`

const RestockLineRow = ({ line }: RestockLineRowProps) => (
  <li className={clsx('px-2', STOCK_STATE_TEXT_CLASS_NAMES.critical)}>
    <div className={restockLine}>
      <ItemListMarker />
      <Link href={`/inventory/${line.itemId}`} className={restockName}>
        {line.name}
      </Link>
      <span aria-hidden="true" className={restockDots}>
        {RESTOCK_DOT_LEADER}
      </span>
      <span className={restockWideValue}>
        {formatRestockEnd(line.quantity, line.shortfall)}
      </span>
    </div>
    <div className={restockNarrowLine}>
      <span aria-hidden="true" className={restockDots}>
        {RESTOCK_DOT_LEADER}
      </span>
      <span className={restockValue}>
        {formatRestockEnd(line.quantity, line.shortfall)}
      </span>
    </div>
  </li>
)

const RestockList = ({ lines }: RestockListProps) => {
  const [toggled, setToggled] = useState<Partial<Record<ItemCategory, boolean>>>(
    {},
  )
  const categoryGroups = groupTallyLinesByCategory(lines)

  if (lines.length === 0) {
    return <p>Nothing needs restocking.</p>
  }

  return (
    <div className={restockStack}>
      {categoryGroups.map((group) => {
        const shortage = getCategoryShortage(group.lines)
        const isOpen = resolveCategoryPanelOpen({
          toggledOpen: toggled[group.category],
          isSearching: false,
          matchCount: group.lines.length,
          hasShortage: shortage !== null,
        })

        return (
          <InventoryCategoryPanel
            key={group.category}
            label={ITEM_CATEGORY_LABELS[group.category]}
            panelId={`restock-category-${group.category}`}
            isOpen={isOpen}
            onToggle={() => {
              setToggled((current) => ({
                ...current,
                [group.category]: !isOpen,
              }))
            }}
            itemCount={group.lines.length}
            shortage={shortage}
          >
            <ul>
              {group.lines.map((line) => (
                <RestockLineRow key={line.itemId} line={line} />
              ))}
            </ul>
          </InventoryCategoryPanel>
        )
      })}
    </div>
  )
}

export { RestockList }
