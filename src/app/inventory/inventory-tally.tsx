'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { ArrowDown01, ArrowDown10, ArrowDownAZ, ArrowDownZA, Layers } from 'lucide-react'
import { clsx } from 'clsx'

import type { HabUnitCategory } from '@/lib/items/load-hab-unit-categories'
import type { HabUnitTallyLine } from '@/lib/items/load-hab-unit-items'
import { filterItemsByName } from '@/lib/items/filter-items-by-name'
import { getCategoryShortage } from '@/lib/items/get-category-shortage'
import { groupTallyLinesByCategory } from '@/lib/items/group-tally-lines-by-category'
import { resolveCategoryPanelOpen } from '@/lib/items/resolve-category-panel-open'
import {
  sortTallyLines,
  toggleTallySort,
  type TallySort,
  type TallySortField,
} from '@/lib/items/sort-tally-lines'
import { STOCK_STATE_LABELS, getStockState } from '@/lib/items/stock-state'
import { Button } from '@/components/ui/button'
import { DotLeader } from '@/components/ui/dot-leader'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { categoryTree, categoryTreeItem, fieldStack } from '@/app/styles/class-names'
import { STOCK_STATE_TEXT_CLASS_NAMES } from '@/app/styles/stock-state-class-names'

import InventoryCategoryPanel from './inventory-category-panel'
import TallyCountControls from './tally-count-controls'

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
const tallySearchRow = clsx('relative', 'flex', 'w-full', 'items-center', 'gap-2')
const tallySearchField = clsx(
  'min-w-0',
  'flex-1',
  'max-sm:focus-within:absolute',
  'max-sm:focus-within:inset-0',
  'max-sm:focus-within:z-10',
  'max-sm:focus-within:bg-background',
)
const tallySortGroup = clsx('flex', 'shrink-0', 'gap-2')
const tallyName = clsx(
  'min-h-[36px]',
  'min-w-0',
  'truncate',
  'leading-[36px]',
  'text-inherit',
)

interface InventoryTallyProps {
  readonly lines: readonly HabUnitTallyLine[]
  readonly customCategories: readonly HabUnitCategory[]
}

interface TallyLineListProps {
  readonly lines: readonly HabUnitTallyLine[]
  readonly isTree: boolean
  readonly onPendingChange: (itemId: string, isPending: boolean) => void
}

const INITIAL_TALLY_SORT: TallySort = { field: 'name', direction: 'asc' }

const sortButtonLabel = (sort: TallySort, field: TallySortField): string => {
  const nextDirection =
    sort.field === field && sort.direction === 'asc' ? 'descending' : 'ascending'
  const fieldLabel = field === 'name' ? 'name' : 'count'
  return `Sort by ${fieldLabel} ${nextDirection}`
}

const TallyLineList = ({
  lines,
  isTree,
  onPendingChange,
}: TallyLineListProps) => (
  <ul className={isTree ? categoryTree : undefined}>
    {lines.map((line) => {
      const stockState = getStockState(line.quantity, line.minimumQuantity)

      return (
        <li key={line.itemId} className={isTree ? categoryTreeItem : 'px-2'}>
          <TallyCountControls
            itemId={line.itemId}
            name={line.name}
            quantity={line.quantity}
            stockStateLabel={STOCK_STATE_LABELS[stockState]}
            stockTextClassName={STOCK_STATE_TEXT_CLASS_NAMES[stockState]}
            onPendingChange={onPendingChange}
          >
            <Link href={`/inventory/${line.itemId}`} className={tallyName}>
              {line.name}
            </Link>
            <DotLeader />
          </TallyCountControls>
        </li>
      )
    })}
  </ul>
)

const InventoryTally = ({ lines, customCategories }: InventoryTallyProps) => {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<TallySort>(INITIAL_TALLY_SORT)
  const [isCategorized, setIsCategorized] = useState(true)
  const [pendingItemIds, setPendingItemIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const handlePendingChange = useCallback((itemId: string, isPending: boolean) => {
    setPendingItemIds((current) => {
      const hasItem = current.has(itemId)
      if (isPending === hasItem) {
        return current
      }
      const next = new Set(current)
      if (isPending) {
        next.add(itemId)
      } else {
        next.delete(itemId)
      }
      return next
    })
  }, [])
  const isCountWritePending = pendingItemIds.size > 0
  const [toggled, setToggled] = useState<Partial<Record<string, boolean>>>({})
  const isNameDescending = sort.field === 'name' && sort.direction === 'desc'
  const isCountDescending = sort.field === 'count' && sort.direction === 'desc'
  const NameSortIcon = isNameDescending ? ArrowDownZA : ArrowDownAZ
  const CountSortIcon = isCountDescending ? ArrowDown10 : ArrowDown01
  const trimmedQuery = query.trim()
  const isSearching = trimmedQuery.length > 0
  const visibleLines = sortTallyLines(filterItemsByName(lines, query), sort)
  const visibleGroups = groupTallyLinesByCategory(visibleLines, customCategories)
  const categoryGroups = groupTallyLinesByCategory(lines, customCategories)
  const shortageByCategory = new Map<string, 'critical' | 'warning' | null>(
    categoryGroups.map((group) => [
      group.key,
      getCategoryShortage(group.lines),
    ]),
  )
  const countByCategory = new Map<string, number>(
    categoryGroups.map((group) => [group.key, group.lines.length]),
  )

  return (
    <div className={tallyRoot}>
      {lines.length === 0 ? (
        <p role="status">Nothing is added here yet.</p>
      ) : (
        <div className={clsx(fieldStack, 'shrink-0')}>
          <Label htmlFor="inventory-name-search">
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
              className={tallySearchField}
            />
            <div role="group" aria-label="Sort tally" className={tallySortGroup}>
              <Button
                type="button"
                aria-pressed={sort.field === 'name'}
                aria-label={sortButtonLabel(sort, 'name')}
                variant={sort.field === 'name' ? 'default' : 'outline'}
                size="icon-touch"
                onClick={() => setSort((current) => toggleTallySort(current, 'name'))}
              >
                <NameSortIcon aria-hidden="true" />
              </Button>
              <Button
                type="button"
                aria-pressed={sort.field === 'count'}
                aria-label={sortButtonLabel(sort, 'count')}
                variant={sort.field === 'count' ? 'default' : 'outline'}
                size="icon-touch"
                onClick={() => setSort((current) => toggleTallySort(current, 'count'))}
              >
                <CountSortIcon aria-hidden="true" />
              </Button>
            </div>
            <Button
              type="button"
              aria-pressed={isCategorized}
              aria-label="Group by category"
              variant={isCategorized ? 'default' : 'outline'}
              size="icon-touch"
              disabled={isCountWritePending}
              onClick={() => setIsCategorized((current) => !current)}
            >
              <Layers aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
      {lines.length > 0 && visibleLines.length === 0 ? (
        <p role="status" className={tallyMiss}>{`No item matches "${trimmedQuery}".`}</p>
      ) : null}
      <div className={tallyPanelStack}>
        {isCategorized
          ? visibleGroups.map((group) => {
              const shortage = shortageByCategory.get(group.key) ?? null
              const isOpen = resolveCategoryPanelOpen({
                toggledOpen: toggled[group.key],
                isSearching,
                matchCount: group.lines.length,
                hasShortage: shortage !== null,
              })

              return (
                <InventoryCategoryPanel
                  key={group.key}
                  label={group.label}
                  panelId={`inventory-category-${group.key}`}
                  isOpen={isOpen}
                  onToggle={() => {
                    setToggled((current) => ({
                      ...current,
                      [group.key]: !isOpen,
                    }))
                  }}
                  itemCount={countByCategory.get(group.key) ?? 0}
                  shortage={shortage}
                >
                  <TallyLineList
                    lines={group.lines}
                    isTree
                    onPendingChange={handlePendingChange}
                  />
                </InventoryCategoryPanel>
              )
            })
          : null}
        {!isCategorized && visibleLines.length > 0 ? (
          <TallyLineList
            lines={visibleLines}
            isTree={false}
            onPendingChange={handlePendingChange}
          />
        ) : null}
      </div>
    </div>
  )
}

export default InventoryTally
