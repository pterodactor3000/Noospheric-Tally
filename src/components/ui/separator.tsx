'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import clsx from 'clsx'

import { Separator as SeparatorPrimitive } from '@base-ui/react/separator'

const separatorVariants = cva(
  clsx(
    'shrink-0',
    'bg-border',
    'data-[orientation=horizontal]:w-full',
    'data-[orientation=vertical]:w-px',
    'data-[orientation=vertical]:self-stretch',
  ),
  {
    variants: {
      variant: {
        default: 'data-[orientation=horizontal]:h-px',
        heading: clsx(
          'my-4',
          'data-[orientation=horizontal]:h-0.5',
          'shadow-[0_0_8px]',
          'shadow-primary/40',
        ),
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Separator({
  className,
  orientation = 'horizontal',
  variant,
  ...props
}: SeparatorPrimitive.Props & VariantProps<typeof separatorVariants>) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={clsx(separatorVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Separator }
