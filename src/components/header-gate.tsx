'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

const SCAN_PATH = '/inventory/scan'

interface HeaderGateProps {
  children: ReactNode
}

const isScanPath = (pathname: string): boolean =>
  pathname === SCAN_PATH || pathname.startsWith(`${SCAN_PATH}/`)

const HeaderGate = ({ children }: HeaderGateProps) => {
  const pathname = usePathname()

  if (isScanPath(pathname)) {
    return null
  }

  return children
}

export { HeaderGate }
