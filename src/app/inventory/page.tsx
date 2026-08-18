import { redirect } from 'next/navigation'
import { clsx } from 'clsx'

import loadCurrentUser from '@/lib/auth/loadCurrentUser'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/(auth)/actions'

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
      <p>{user.email}</p>
      <form
        action={signOut}
        className={clsx('mt-8', 'flex', 'flex-col', 'gap-4')}
      >
        <Button variant="outline" type="submit">
          Sign out
        </Button>
      </form>
    </main>
  )
}

export default InventoryPage
