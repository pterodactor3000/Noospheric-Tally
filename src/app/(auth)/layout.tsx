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
      <div className={clsx('mx-auto', 'w-full', 'max-w-4xl')}>
        <div
          className={clsx(
            'border',
            'border-foreground/50',
            'bg-white/70',
            'p-8',
            'shadow-sm',
            'backdrop-blur',
            'sm:p-12',
            'dark:bg-black/20',
          )}
        >
          <p
            className={clsx(
              'mb-8',
              'font-mono',
              'font-semibold',
              'tracking-[0.24em]',
              'text-foreground/70',
              'uppercase',
            )}
          >
            Noospheric Tally
          </p>
          {children}
        </div>
      </div>
    </main>
  )
}

export default AuthLayout
