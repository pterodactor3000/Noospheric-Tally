import { signOut } from '@/app/(auth)/actions'

import { Button } from './ui/button'

const SignOutButton = () => {
  return (
    <form action={signOut}>
      <Button variant="outline" type="submit">
        Sign out
      </Button>
    </form>
  )
}

export { SignOutButton }
