import type { ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'

import { buttonStateBackground } from './button-state-background'

const countStepperGroup = clsx(
  'inline-grid',
  'shrink-0',
  'grid-cols-[auto_auto_auto]',
  'items-center',
  'gap-x-2',
  'whitespace-nowrap',
)

const countButton = clsx(
  'bracket-frame',
  'inline-flex',
  'h-[1.25em]',
  'w-auto',
  'min-h-0',
  'min-w-0',
  'shrink-0',
  'items-center',
  'justify-center',
  'border-0',
  'bg-transparent',
  buttonStateBackground,
  'transition-colors',
  'px-[0.6em]',
  'font-[inherit]',
  'text-[length:inherit]',
  'leading-none',
  'text-inherit',
  'no-underline',
  'disabled:text-inherit',
  'disabled:opacity-100',
)

const countValueVariants = cva('text-center', {
  variants: {
    density: {
      compact: clsx('w-[2ch]', 'min-h-[36px]', 'leading-[36px]'),
      comfortable: clsx('min-h-11', 'leading-11'),
    },
  },
})

interface CountStepperProps
  extends Required<VariantProps<typeof countValueVariants>> {
  readonly name: string
  readonly value: number
  readonly isDecreaseDisabled: boolean
  readonly isIncreaseDisabled: boolean
  readonly onDecrease: () => void
  readonly onIncrease: () => void
  readonly children?: ReactNode
}

function CountStepper({
  name,
  value,
  density,
  isDecreaseDisabled,
  isIncreaseDisabled,
  onDecrease,
  onIncrease,
  children,
}: CountStepperProps) {
  return (
    <span className={countStepperGroup}>
      <button
        type="button"
        disabled={isDecreaseDisabled}
        aria-label={`Decrease ${name}`}
        className={countButton}
        onClick={onDecrease}
      >
        -
      </button>
      <span className={countValueVariants({ density })}>{value}</span>
      <button
        type="button"
        disabled={isIncreaseDisabled}
        aria-label={`Increase ${name}`}
        className={countButton}
        onClick={onIncrease}
      >
        +
      </button>
      {children}
    </span>
  )
}

export { CountStepper }
