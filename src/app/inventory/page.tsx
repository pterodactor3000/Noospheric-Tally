import { redirect } from 'next/navigation'

import loadCurrentUser from '@/lib/auth/loadCurrentUser'

const InventoryPage = async () => {
  const user = await loadCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <p>{user.email}</p>
    </main>
  )
}

export default InventoryPage
