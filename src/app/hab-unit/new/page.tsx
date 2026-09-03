import { redirect } from 'next/navigation'

import loadCurrentUser from '@/lib/auth/loadCurrentUser'
import { loadCurrentHabUnit } from '@/lib/hab-unit/load-current-hab-unit'

import HabUnitNameForm from './hab-unit-name-form'
import { clsx } from 'clsx'

const NewHabUnit = async () => {
  const user = await loadCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const habUnit = await loadCurrentHabUnit()
  if (habUnit) {
    redirect('/inventory')
  }

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
          <HabUnitNameForm />
        </div>
      </div>
    </main>
  )
}

export default NewHabUnit
