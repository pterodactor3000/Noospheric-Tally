import { clsx } from 'clsx'

import { signOut } from '@/app/(auth)/actions'

import { Button } from './ui/button'

const SignOutButton = () => {
  return (
    <form action={signOut} className={clsx()}>
      <Button variant="outline" type="submit">
        Sign out
      </Button>
    </form>
  )
}

export { SignOutButton }
