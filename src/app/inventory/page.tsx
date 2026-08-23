import { redirect } from 'next/navigation'
import { clsx } from 'clsx'

import loadCurrentUser from '@/lib/auth/loadCurrentUser'
import { SignOutButton } from '@/components/sign-out-button'

const InventoryPage = async () => {
  const user = await loadCurrentUser()
  if (!user) {
    redirect('/login')
  }

  return (
    <main
      className={clsx(
        'flex',
        'min-h-screen',
        'items-center',
        'justify-center',
        'px-6',
      )}
    >
      <p>Awaiting input query</p>
      <br />
      <SignOutButton />
    </main>
  )
}

export default InventoryPage
