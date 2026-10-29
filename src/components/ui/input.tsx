'use client'

import * as React from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'

import { clsx } from 'clsx'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={clsx(
        'h-8',
        'w-full',
        'min-w-0',
        'rounded-lg',
        'border-2',
        'border-input',
        'bg-transparent',
        'px-2.5',
        'py-1',
        'text-base',
        'transition-colors',
        'outline-none',
        'file:inline-flex',
        'file:h-6',
        'file:border-0',
        'file:bg-transparent',
        'file:text-sm',
        'file:font-medium',
        'file:text-foreground',
        'placeholder:text-muted-foreground',
        'focus-visible:border-ring',
        'focus-visible:ring-3',
        'focus-visible:ring-ring/50',
        'disabled:pointer-events-none',
        'disabled:cursor-not-allowed',
        'disabled:bg-input/50',
        'disabled:opacity-50',
        'aria-invalid:border-destructive',
        'aria-invalid:ring-3',
        'aria-invalid:ring-destructive/20',
        'focus-visible:aria-invalid:border-destructive',
        'md:text-sm',
        'dark:bg-input/30',
        'dark:disabled:bg-input/80',
        'dark:aria-invalid:border-destructive',
        'dark:aria-invalid:ring-destructive/40',
        'dark:focus-visible:aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
