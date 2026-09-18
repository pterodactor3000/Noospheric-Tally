import { clsx } from 'clsx'

interface AlreadyStockedProps {
  name: string
}
const AlreadyStocked = ({ name }: AlreadyStockedProps) => {
  return (
    <>
      <h1
        className={clsx(
          'font-mono',
          'uppercase',
          'text-balance',
          'text-4xl',
          'font-semibold',
          'tracking-tight',
          'sm:text-5xl',
        )}
      >
        Already stocked
      </h1>
      <p
        className={clsx(
          'font-mono',
          'mt-6',
          'text-pretty',
          'text-foreground/70',
          'leading-7',
          'text-base',
        )}
      >
        {name}
      </p>
    </>
  )
}

export { AlreadyStocked }
