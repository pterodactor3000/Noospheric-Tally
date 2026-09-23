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
        'fixed',
        'inset-x-0',
        'top-0',
        'border-b-2',
        'border-ring/75',
        'shadow-lg',
        'shadow-primary/25',
      )}
    >
      <TallyLabel />
      {user !== null ? <SignOutButton /> : null}
    </header>
  )
}

export { Header }
