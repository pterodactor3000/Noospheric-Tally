import clsx from 'clsx'
import Link from 'next/link'

import { TerminalCaret } from './ui/terminal-caret'

const TallyLabel = () => {
  return (
    <Link href="/" className={clsx('flex', 'items-center')}>
      <p
        className={clsx(
          'font-mono',
          'font-semibold',
          'tracking-[0.24em]',
          'max-sm:tracking-[0.08em]',
          'text-foreground/70',
          'uppercase',
          'terminal-type',
          'inline-block',
          'max-w-0',
          'overflow-hidden',
          'whitespace-nowrap',
          'animate-terminal-type',
        )}
      >
        Noospheric Tally
        <TerminalCaret />
      </p>
    </Link>
  )
}

export { TallyLabel }
