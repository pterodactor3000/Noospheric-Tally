'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { validateCredentials } from '@/lib/auth/validateCredentials'

interface AuthActionError {
  status: 'error'
  message: string
  field?: 'email' | 'password'
}

const AUTH_FAILURE_MESSAGE = '! Invalid credentials ! Try again !'
const SIGN_UP_FAILURE_MESSAGE =
  '! Cogitation unit requisition failed ! Pray to the Omnissiah and try later !'
const EMAIL_ALREADY_REGISTERED_MESSAGE =
  '! Cogitation unit already requisitioned for this user ! Investigate before continuing !'

const getCredentialFields = (formData: FormData) => {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  return {
    email: typeof email === 'string' ? email : '',
    password: typeof password === 'string' ? password : '',
  }
}

const mapSupabaseAuthError = (message: string): AuthActionError => {
  const normalizedError = message.toLowerCase()

  if (normalizedError.includes('invalid login credentials')) {
    return {
      status: 'error',
      message: AUTH_FAILURE_MESSAGE,
    }
  }

  if (normalizedError.includes('already registered')) {
    return {
      status: 'error',
      message: EMAIL_ALREADY_REGISTERED_MESSAGE,
      field: 'email',
    }
  }

  return {
    status: 'error',
    message: AUTH_FAILURE_MESSAGE,
  }
}

const getParsedCredentials = (formData: FormData) => {
  const parsedCredentials = validateCredentials(getCredentialFields(formData))

  if (parsedCredentials.status === 'invalid') {
    return {
      status: 'error',
      message: parsedCredentials.message,
      field: parsedCredentials.field,
    }
  }

  return {
    email: parsedCredentials.email,
    password: parsedCredentials.password,
  }
}

const signInWithPassword = async (
  formData: FormData,
): Promise<AuthActionError> => {
  const parsedCredentials = getParsedCredentials(formData)

  if ('status' in parsedCredentials && parsedCredentials.status === 'error') {
    return {
      status: 'error',
      message: parsedCredentials.message,
      field: parsedCredentials.field,
    }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: parsedCredentials.email!,
      password: parsedCredentials.password!,
    })

    if (error) {
      return mapSupabaseAuthError(error.message)
    }
  } catch (error: unknown) {
    console.error('signInWithPassword failed', {
      email: parsedCredentials.email,
      error,
    })
    return {
      status: 'error',
      message: AUTH_FAILURE_MESSAGE,
    }
  }

  revalidatePath('/', 'layout')
  redirect('/inventory')
}

const signUpWithPassword = async (
  formData: FormData,
): Promise<AuthActionError> => {
  const parsedCredentials = getParsedCredentials(formData)

  if ('status' in parsedCredentials && parsedCredentials.status === 'error') {
    return {
      status: 'error',
      message: parsedCredentials.message,
      field: parsedCredentials.field,
    }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({
      email: parsedCredentials.email!,
      password: parsedCredentials.password!,
    })

    if (error) {
      const mappedError = mapSupabaseAuthError(error.message)

      if (mappedError.message === AUTH_FAILURE_MESSAGE) {
        return { status: 'error', message: SIGN_UP_FAILURE_MESSAGE }
      }

      return mappedError
    }
  } catch (error: unknown) {
    console.error('signUpWithPassword failed', {
      email: parsedCredentials.email,
      error,
    })
    return {
      status: 'error',
      message: SIGN_UP_FAILURE_MESSAGE,
    }
  }

  revalidatePath('/', 'layout')
  redirect('/inventory')
}

const signOut = async (): Promise<void> => {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('signOut failed', error)
      return
    }
  } catch (error: unknown) {
    console.error('signOut failed', error)
    return
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export { signInWithPassword, signUpWithPassword, signOut }
