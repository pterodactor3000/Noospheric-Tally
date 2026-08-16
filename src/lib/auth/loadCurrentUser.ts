import { createClient } from '../supabase/server'

const loadCurrentUser = async () => {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return null
  }

  return data.user
}

export default loadCurrentUser
