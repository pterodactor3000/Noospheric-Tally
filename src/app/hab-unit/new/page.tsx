import HabUnitNameForm from './hab-unit-name-form'
import { clsx } from 'clsx'
import { requireCurrentHabUnit, requireCurrentUser } from '@/lib/helpers'

const NewHabUnit = async () => {
  const user = await requireCurrentUser()
  const habUnit = await requireCurrentHabUnit()

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
          <HabUnitNameForm defaultName={user.email?.split('@')[0] ?? ''} />
        </div>
      </div>
    </main>
  )
}

export default NewHabUnit
