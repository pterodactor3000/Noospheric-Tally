import type { ComponentProps } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'

const textLinkClassName = clsx(
  'font-medium',
  'text-button',
  'underline-offset-4',
  'hover:underline',
)

function TextLink(props: Omit<ComponentProps<typeof Link>, 'className'>) {
  return <Link {...props} className={textLinkClassName} />
}

export { TextLink }
