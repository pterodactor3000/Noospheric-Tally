'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowDown01, ArrowDown10, ArrowDownAZ, ArrowDownZA } from 'lucide-react'
import { clsx } from 'clsx'

import type { HabUnitTallyLine } from '@/lib/items/load-hab-unit-items'
import { filterItemsByName } from '@/lib/items/filter-items-by-name'
import { getCategoryShortage } from '@/lib/items/get-category-shortage'
import { groupTallyLinesByCategory } from '@/lib/items/group-tally-lines-by-category'
import {
  ITEM_CATEGORY_LABELS,
  type ItemCategory,
} from '@/lib/items/item-category'
import { resolveCategoryPanelOpen } from '@/lib/items/resolve-category-panel-open'
import {
  sortTallyLines,
  toggleTallySort,
  type TallySort,
  type TallySortField,
} from '@/lib/items/sort-tally-lines'
import { STOCK_STATE_LABELS, getStockState } from '@/lib/items/stock-state'
import { ItemListMarker } from '@/components/item-list-marker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  fieldControl,
  fieldLabel,
  fieldStack,
} from '@/app/styles/class-names'
import { STOCK_STATE_TEXT_CLASS_NAMES } from '@/app/styles/stock-state-class-names'

import InventoryCategoryPanel from './inventory-category-panel'
import TallyCountControls from './tally-count-controls'

const TALLY_DOT_LEADER = '.'.repeat(300)

const tallyRoot = clsx('contents')
const tallyPanelStack = clsx(
  'mt-[1rem]',
  'min-h-[36px]',
  'flex-1',
  'overflow-y-auto',
  'text-[14px]',
  'sm:text-[16px]',
)
const tallyMiss = clsx('mt-[1rem]')
const tallySearchRow = clsx('flex', 'items-center', 'gap-2')
const tallySortGroup = clsx('flex', 'shrink-0', 'gap-2')
const tallyName = clsx(
  'min-h-[36px]',
  'min-w-0',
  'truncate',
  'leading-[36px]',
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

const INITIAL_TALLY_SORT: TallySort = { field: 'name', direction: 'asc' }

const sortButtonLabel = (sort: TallySort, field: TallySortField): string => {
  const nextDirection =
    sort.field === field && sort.direction === 'asc' ? 'descending' : 'ascending'
  const fieldLabel = field === 'name' ? 'name' : 'count'
  return `Sort by ${fieldLabel} ${nextDirection}`
}

const InventoryTally = ({ lines }: InventoryTallyProps) => {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<TallySort>(INITIAL_TALLY_SORT)
  const [toggled, setToggled] = useState<
    Partial<Record<ItemCategory, boolean>>
  >({})
  const isNameDescending = sort.field === 'name' && sort.direction === 'desc'
  const isCountDescending = sort.field === 'count' && sort.direction === 'desc'
  const NameSortIcon = isNameDescending ? ArrowDownZA : ArrowDownAZ
  const CountSortIcon = isCountDescending ? ArrowDown10 : ArrowDown01
  const trimmedQuery = query.trim()
  const isSearching = trimmedQuery.length > 0
  const visibleLines = sortTallyLines(filterItemsByName(lines, query), sort)
  const visibleGroups = groupTallyLinesByCategory(visibleLines)
  const shortageByCategory = new Map<ItemCategory, 'critical' | 'warning' | null>(
    groupTallyLinesByCategory(lines).map((group) => [
      group.category,
      getCategoryShortage(group.lines),
    ]),
  )

  return (
    <div className={tallyRoot}>
      {lines.length === 0 ? (
        <p role="status">Nothing is added here yet.</p>
      ) : (
        <div className={clsx(fieldStack, 'shrink-0')}>
          <Label htmlFor="inventory-name-search" className={fieldLabel}>
            Search by name
          </Label>
          <div className={tallySearchRow}>
            <Input
              type="search"
              id="inventory-name-search"
              autoComplete="off"
              value={query}
              onChange={(event) => {
                setQuery(event.currentTarget.value)
                setToggled({})
              }}
              className={clsx(fieldControl, 'min-w-0', 'flex-1')}
            />
            <div role="group" aria-label="Sort tally" className={tallySortGroup}>
              <Button
                type="button"
                aria-pressed={sort.field === 'name'}
                aria-label={sortButtonLabel(sort, 'name')}
                variant={sort.field === 'name' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setSort((current) => toggleTallySort(current, 'name'))}
                className="size-11!"
              >
                <NameSortIcon aria-hidden="true" />
              </Button>
              <Button
                type="button"
                aria-pressed={sort.field === 'count'}
                aria-label={sortButtonLabel(sort, 'count')}
                variant={sort.field === 'count' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setSort((current) => toggleTallySort(current, 'count'))}
                className="size-11!"
              >
                <CountSortIcon aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      )}
      {lines.length > 0 && visibleLines.length === 0 ? (
        <p role="status" className={tallyMiss}>{`No item matches "${trimmedQuery}".`}</p>
      ) : null}
      <div className={tallyPanelStack}>
        {visibleGroups.map((group) => {
          const shortage = shortageByCategory.get(group.category) ?? null
          const isOpen = resolveCategoryPanelOpen({
            toggledOpen: toggled[group.category],
            isSearching,
            matchCount: group.lines.length,
            hasShortage: shortage !== null,
          })

          return (
            <InventoryCategoryPanel
              key={group.category}
              label={ITEM_CATEGORY_LABELS[group.category]}
              panelId={`inventory-category-${group.category}`}
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
                {group.lines.map((line) => {
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
                        <ItemListMarker />
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
            </InventoryCategoryPanel>
          )
        })}
      </div>
    </div>
  )
}

export default InventoryTally
