'use client'

import { type ReactNode } from 'react'
import { clsx } from 'clsx'

import { STOCK_STATE_TEXT_CLASS_NAMES } from '@/app/styles/stock-state-class-names'
import type { StockState } from '@/lib/items/stock-state'

interface InventoryCategoryPanelProps {
  readonly label: string
  readonly panelId: string
  readonly isOpen: boolean
  readonly onToggle: () => void
  readonly itemCount: number
  readonly shortage: 'critical' | 'warning' | null
  readonly children: ReactNode
}

interface CategoryPanelChevronProps {
  readonly isOpen: boolean
}

const CategoryPanelChevron = ({ isOpen }: CategoryPanelChevronProps) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={clsx(
      'size-5',
      'shrink-0',
      'transition-transform',
      'duration-500',
      'ease-in-out',
      'motion-reduce:transition-none',
      isOpen && 'rotate-180',
    )}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
)

const getCategoryHeaderStockState = (
  shortage: InventoryCategoryPanelProps['shortage'],
  itemCount: number,
): StockState | null => {
  if (shortage !== null) {
    return shortage
  }

  if (itemCount > 0) {
    return 'in-stock'
  }

  return null
}

const InventoryCategoryPanel = ({
  label,
  panelId,
  isOpen,
  onToggle,
  itemCount,
  shortage,
  children,
}: InventoryCategoryPanelProps) => {
  const headerStockState = getCategoryHeaderStockState(shortage, itemCount)

  return (
    <div>
      <h2 className="m-0">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          className={clsx(
            'flex',
            'w-full',
            'items-center',
            'justify-between',
            'gap-3',
            'text-left',
            'font-mono',
            'text-base',
            'leading-7',
            headerStockState === null
              ? null
              : STOCK_STATE_TEXT_CLASS_NAMES[headerStockState],
          )}
        >
          <span className={clsx('flex', 'min-w-0', 'items-center', 'gap-2')}>
            <span className="truncate">{label}</span>
            <span className="shrink-0">{itemCount}</span>
          </span>
          <CategoryPanelChevron isOpen={isOpen} />
        </button>
      </h2>
      <div
        className={clsx(
          'grid',
          'transition-[grid-template-rows]',
          'duration-500',
          'ease-in-out',
          'motion-reduce:transition-none',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className={clsx('min-h-0', 'overflow-hidden')}>
          <div id={panelId} inert={!isOpen} aria-hidden={!isOpen}>
            {itemCount === 0 ? <p className="px-2">Nothing in this category.</p> : children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default InventoryCategoryPanel
