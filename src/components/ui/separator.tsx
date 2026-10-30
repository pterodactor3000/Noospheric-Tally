'use client'

import clsx from 'clsx'

import { Separator as SeparatorPrimitive } from '@base-ui/react/separator'

function Separator({
  className,
  orientation = 'horizontal',
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={clsx(
        'shrink-0',
        'bg-border',
        'data-[orientation=horizontal]:h-px',
        'data-[orientation=horizontal]:w-full',
        'data-[orientation=vertical]:w-px',
        'data-[orientation=vertical]:self-stretch',
        className,
      )}
      {...props}
    />
  )
}

export { Separator }
