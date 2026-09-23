import clsx from 'clsx'
import Link from 'next/link'

const TallyLabel = () => {
  return (
    <Link href={'/'}>
      <p
        className={clsx(
          'font-mono',
          'font-semibold',
          'tracking-[0.24em]',
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
        <span
          className={clsx(
            'border-r-[1ch]',
            'border-foreground',
            'animate-terminal-blink',
          )}
        />
      </p>
    </Link>
  )
}

export { TallyLabel }
