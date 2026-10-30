import Link from 'next/link'
import { clsx } from 'clsx'

import type { RestockLine } from '@/lib/items/rank-restock-lines'
import { STOCK_STATE_TEXT_CLASS_NAMES } from '@/app/styles/stock-state-class-names'
import { ItemListMarker } from '@/components/item-list-marker'

const RESTOCK_DOT_LEADER = '.'.repeat(300)

const restockList = clsx('mt-[1rem]', 'text-[14px]', 'sm:text-[16px]')
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

const formatRestockEnd = (quantity: number, shortfall: number): string =>
  `${quantity} // [${shortfall} short]`

const RestockList = ({ lines }: RestockListProps) => {
  if (lines.length === 0) {
    return <p>Nothing needs restocking.</p>
  }

  return (
    <ul className={restockList}>
      {lines.map((line) => (
        <li
          key={line.itemId}
          className={clsx('px-2', STOCK_STATE_TEXT_CLASS_NAMES.critical)}
        >
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
      ))}
    </ul>
  )
}

export { RestockList }
