import Link from 'next/link'
import { clsx } from 'clsx'

import { Button } from '@/components/ui/button'
import { TallyLabel } from '@/components/tally-label'

export default function Home() {
  return (
    <main
      className={clsx(
        'flex',
        'min-h-screen',
        'items-center',
        'bg-background',
        'px-6',
        'py-12',
        'text-foreground',
        'sm:px-10',
      )}
    >
      <div className={clsx('mx-auto', 'w-full', 'max-w-4xl')}>
        <div
          className={clsx(
            'border',
            'border-foreground/50',
            'p-8',
            'shadow-sm',
            'backdrop-blur',
            'sm:p-12',
            'dark:bg-black/20',
          )}
        >
          <TallyLabel />
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
            Know what is at home before you shop.
          </h1>
          <p
            className={clsx(
              'font-mono',
              'uppercase',
              'mt-6',
              'text-pretty',
              'text-foreground/70',
              'leading-7',
              'text-base',
            )}
          >
            Noospheric Tally keeps everyday supplies visible at the moment stock
            changes. The deployment foundation is in place for the inventory
            experience to follow.
          </p>

          <div className={clsx('mt-8', 'flex', 'flex-col', 'gap-4')}>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/login" />}
              className={clsx('font-mono', 'uppercase', 'min-h-11', 'w-full')}
            >
              Sign in
            </Button>
          </div>

          <p
            className={clsx(
              'mt-6',
              'text-sm',
              'text-foreground/70',
              'font-mono',
              'uppercase',
            )}
          >
            No personal cogitation unit?{' '}
            <Link
              href="/signup"
              className={clsx(
                'font-medium',
                'text-foreground',
                'underline-offset-4',
                'hover:underline',
                'font-mono',
                'uppercase',
              )}
            >
              Requisite one
            </Link>
          </p>

          <div
            className={clsx(
              'mt-12',
              'grid',
              'gap-4',
              'border-t',
              'border-foreground/50',
              'pt-6',
              'sm:grid-cols-2',
            )}
          >
            <section>
              <h2
                className={clsx(
                  'font-mono',
                  'font-semibold',
                  'tracking-[0.18em]',
                  'text-foreground/70',
                  'uppercase',
                )}
              >
                Next milestone
              </h2>
              <p
                className={clsx(
                  'mt-2',
                  'text-sm',
                  'leading-6',
                  'text-foreground/70',
                  'font-mono',
                  'uppercase',
                )}
              >
                Sign in and create a household inventory.
              </p>
            </section>
            <section>
              <h2
                className={clsx(
                  'font-mono',
                  'font-semibold',
                  'tracking-[0.18em]',
                  'text-foreground/70',
                  'uppercase',
                )}
              >
                Platform
              </h2>
              <p
                className={clsx(
                  'mt-2',
                  'text-sm',
                  'leading-6',
                  'text-foreground/70',
                  'font-mono',
                  'uppercase',
                )}
              >
                Secure web delivery for phone-ready barcode scanning.
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
