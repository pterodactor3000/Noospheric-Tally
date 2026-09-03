import { redirect } from 'next/navigation'
import { clsx } from 'clsx'

import loadCurrentUser from '@/lib/auth/loadCurrentUser'
import { loadCurrentHabUnit } from '@/lib/hab-unit/load-current-hab-unit'

const InventoryPage = async () => {
  const user = await loadCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const habUnit = await loadCurrentHabUnit()
  if (!habUnit) {
    redirect('/hab-unit/new')
  }

  return (
    <main
      className={clsx(
        'flex',
        'flex-col',
        'min-h-screen',
        'items-center',
        'justify-center',
        'px-6',
      )}
    >
      <p>Your {habUnit.name} tally</p>
      <br />
    </main>
  )
}

export default InventoryPage
