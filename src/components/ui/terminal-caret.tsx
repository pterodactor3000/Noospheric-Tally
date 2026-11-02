import type { ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'

const terminalCaretVariants = cva(
  clsx('border-r-[1ch]', 'border-foreground', 'animate-terminal-blink'),
  {
    variants: {
      visibility: {
        always: '',
        'input-focus': clsx(
          'hidden',
          'shrink-0',
          'group-focus-within/input:block',
          'h-[1.25em]',
        ),
      },
    },
    defaultVariants: {
      visibility: 'always',
    },
  },
)

interface TerminalCaretProps
  extends Omit<ComponentProps<'span'>, 'className' | 'children'>,
    VariantProps<typeof terminalCaretVariants> {}

function TerminalCaret({ visibility, ...props }: TerminalCaretProps) {
  return <span {...props} className={terminalCaretVariants({ visibility })} />
}

export { TerminalCaret, terminalCaretVariants }
