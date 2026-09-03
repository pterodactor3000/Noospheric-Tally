import { clsx } from 'clsx'
import { TallyLabel } from './tally-label'
import { SignOutButton } from './sign-out-button'
import loadCurrentUser from '@/lib/auth/loadCurrentUser'

const Header = async () => {
  const user = await loadCurrentUser()
  return (
    <header
      className={clsx(
        'flex',
        'justify-between',
        'px-6',
        'py-12',
        'sm:px-10',
        'shadow-lg',
        'shadow-primary/40',
        'fixed',
        'inset-0',
      )}
    >
      <TallyLabel />

      {user !== null ? <SignOutButton /> : null}
    </header>
  )
}

export { Header }
