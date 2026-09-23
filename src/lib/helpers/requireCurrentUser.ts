import { redirect } from 'next/navigation'
import loadCurrentUser from '../auth/loadCurrentUser'

const requireCurrentUser = async () => {
  const user = await loadCurrentUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

export { requireCurrentUser }
