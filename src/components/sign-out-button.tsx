import { clsx } from 'clsx'

import { signOut } from '@/app/(auth)/actions'

import { Button } from './ui/button'

const SignOutButton = () => {
  return (
    <form
      action={signOut}
      className={clsx('mt-8', 'flex', 'flex-col', 'gap-4')}
    >
      <Button variant="outline" type="submit">
        Sign out
      </Button>
    </form>
  )
}

export { SignOutButton }
