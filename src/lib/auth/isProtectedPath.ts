const PROTECTED_PATH_PREFIXES = ['/inventory', '/hab-unit'] as const

const isProtectedPath = (pathname: string): boolean => {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export { isProtectedPath }
