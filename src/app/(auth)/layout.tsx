import React from 'react'
import { redirect } from 'next/navigation'

import loadCurrentUser from '@/lib/auth/loadCurrentUser'
import { clsx } from 'clsx'

const AuthLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await loadCurrentUser()
  if (user) {
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
      <div className={clsx('mx-auto', 'w-full', 'max-w-md')}>
        <p>Noospheric Tally</p>
        {children}
      </div>
    </main>
  )
}

export default AuthLayout
