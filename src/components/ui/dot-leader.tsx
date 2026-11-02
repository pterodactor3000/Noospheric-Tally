import type { ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'

const DOT_LEADER_TEXT = '.'.repeat(300)

const dotLeaderVariants = cva(
  clsx('min-w-0', 'flex-1', 'overflow-hidden', 'whitespace-nowrap'),
  {
    variants: {
      tone: {
        inherit: '',
        muted: 'text-muted-foreground',
      },
    },
    defaultVariants: {
      tone: 'inherit',
    },
  },
)

interface DotLeaderProps
  extends Omit<ComponentProps<'span'>, 'className' | 'children'>,
    VariantProps<typeof dotLeaderVariants> {}

function DotLeader({ tone, ...props }: DotLeaderProps) {
  return (
    <span aria-hidden="true" {...props} className={dotLeaderVariants({ tone })}>
      {DOT_LEADER_TEXT}
    </span>
  )
}

export { DOT_LEADER_TEXT, DotLeader }
