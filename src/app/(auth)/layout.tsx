import React from 'react'
import { redirect } from 'next/navigation'

import { contentWidth, pageShell } from '@/app/styles/class-names'
import loadCurrentUser from '@/lib/auth/loadCurrentUser'

const AuthLayout = async ({ children }: { children: React.ReactNode }) => {
  const user = await loadCurrentUser()
  if (user) {
    redirect('/inventory')
  }

  return (
    <main className={pageShell}>
      <div className={contentWidth}>{children}</div>
    </main>
  )
}

export default AuthLayout
