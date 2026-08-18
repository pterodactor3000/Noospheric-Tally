import clsx from 'clsx'

const TallyLabel = () => {
  return (
    <p
      className={clsx(
        'mb-8',
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
  )
}

export { TallyLabel }
