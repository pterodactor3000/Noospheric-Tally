import React from 'react'
import { redirect } from 'next/navigation'
import { clsx } from 'clsx'

import loadCurrentUser from '@/lib/auth/loadCurrentUser'
import { TallyLabel } from '@/components/tally-label'

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
          {children}
        </div>
      </div>
    </main>
  )
}

export default AuthLayout
