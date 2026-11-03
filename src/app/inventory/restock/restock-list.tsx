'use client'

import { useState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'

import type { HabUnitCategory } from '@/lib/items/load-hab-unit-categories'
import type { RestockLine } from '@/lib/items/rank-restock-lines'
import { getCategoryShortage } from '@/lib/items/get-category-shortage'
import { groupTallyLinesByCategory } from '@/lib/items/group-tally-lines-by-category'
import { resolveCategoryPanelOpen } from '@/lib/items/resolve-category-panel-open'
import { categoryTree, categoryTreeItem } from '@/app/styles/class-names'
import { STOCK_STATE_TEXT_CLASS_NAMES } from '@/app/styles/stock-state-class-names'
import { DotLeader } from '@/components/ui/dot-leader'
import InventoryCategoryPanel from '../inventory-category-panel'

const restockStack = clsx('mt-[1rem]', 'text-[14px]', 'sm:text-[16px]')
const restockLine = clsx('flex', 'items-baseline', 'gap-2')
const restockName = clsx(
  'min-h-[36px]',
  'min-w-0',
  'truncate',
  'leading-[36px]',
  'text-inherit',
)
const restockValue = clsx('shrink-0', 'whitespace-nowrap')
const restockWideValue = clsx(restockValue, 'max-sm:hidden')
const restockNarrowLine = clsx(restockLine, 'sm:hidden')

interface RestockListProps {
  readonly lines: readonly RestockLine[]
  readonly customCategories: readonly HabUnitCategory[]
}

interface RestockLineRowProps {
  readonly line: RestockLine
}

const formatRestockEnd = (quantity: number, shortfall: number): string =>
  `${quantity} // [${shortfall} short]`

const RestockLineRow = ({ line }: RestockLineRowProps) => (
  <li className={clsx(categoryTreeItem, STOCK_STATE_TEXT_CLASS_NAMES.critical)}>
    <div className={restockLine}>
      <Link href={`/inventory/${line.itemId}`} className={restockName}>
        {line.name}
      </Link>
      <DotLeader />
      <span className={restockWideValue}>
        {formatRestockEnd(line.quantity, line.shortfall)}
      </span>
    </div>
    <div className={restockNarrowLine}>
      <DotLeader />
      <span className={restockValue}>
        {formatRestockEnd(line.quantity, line.shortfall)}
      </span>
    </div>
  </li>
)

const RestockList = ({ lines, customCategories }: RestockListProps) => {
  const [toggled, setToggled] = useState<Partial<Record<string, boolean>>>({})
  const categoryGroups = groupTallyLinesByCategory(lines, customCategories)

  if (lines.length === 0) {
    return <p>Nothing needs restocking.</p>
  }

  return (
    <div className={restockStack}>
      {categoryGroups.map((group) => {
        const shortage = getCategoryShortage(group.lines)
        const isOpen = resolveCategoryPanelOpen({
          toggledOpen: toggled[group.key],
          isSearching: false,
          matchCount: group.lines.length,
          hasShortage: shortage !== null,
        })

        return (
          <InventoryCategoryPanel
            key={group.key}
            label={group.label}
            panelId={`restock-category-${group.key}`}
            isOpen={isOpen}
            onToggle={() => {
              setToggled((current) => ({
                ...current,
                [group.key]: !isOpen,
              }))
            }}
            itemCount={group.lines.length}
            shortage={shortage}
          >
            <ul className={categoryTree}>
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
