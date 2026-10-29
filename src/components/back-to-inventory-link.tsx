'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

import { buttonVariants } from '@/components/ui/button'

const shouldShowBackToInventory = (pathname: string): boolean =>
  pathname.startsWith('/inventory/')

const BackToInventoryLink = () => {
  const pathname = usePathname()

  if (!shouldShowBackToInventory(pathname)) {
    return null
  }

  return (
    <div className={clsx('w-full', 'shrink-0', 'px-6', 'pt-3', 'sm:px-10')}>
      <Link
        href="/inventory"
        className={buttonVariants({
          variant: 'link',
          className: clsx('-ml-2.5', 'min-h-11'),
        })}
      >
        Back to inventory
      </Link>
    </div>
  )
}

export { BackToInventoryLink }
