'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

import { Button } from '@/components/ui/button'

const shouldShowBackToInventory = (pathname: string): boolean =>
  pathname.startsWith('/inventory/')

const BackToInventoryLink = () => {
  const pathname = usePathname()

  if (!shouldShowBackToInventory(pathname)) {
    return null
  }

  return (
    <div className={clsx('w-full', 'shrink-0', 'px-6', 'pt-3', 'sm:px-10')}>
      <Button
        variant="link"
        nativeButton={false}
        render={<Link href="/inventory" />}
        className="-ml-2.5"
      >
        Back to inventory
      </Button>
    </div>
  )
}

export { BackToInventoryLink }
