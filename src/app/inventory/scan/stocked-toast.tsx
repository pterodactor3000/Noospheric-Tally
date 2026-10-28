'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

interface StockedToastProps {
  name: string
  barcode: string
  show: boolean
}

const StockedToast = ({ name, barcode, show }: StockedToastProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isVisible, setIsVisible] = useState(show)

  if (show && !isVisible) {
    setIsVisible(true)
  }

  useEffect(() => {
    if (!show) {
      return
    }

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.delete('added')
    const query = nextParams.toString()
    router.replace(query ? `${pathname}?${query}` : pathname)
  }, [show, pathname, searchParams, router])

  if (!isVisible) {
    return null
  }

  return (
    <p role="status" aria-live="polite">
      Item {name} {barcode} was added to inventory.
    </p>
  )
}

export { StockedToast }
