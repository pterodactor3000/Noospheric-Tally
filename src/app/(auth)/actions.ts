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

const AUTH_FAILURE_MESSAGE = 'Could not sign in. Check email and password.'
const SIGN_UP_FAILURE_MESSAGE = 'Could not create the account. Try again.'
const EMAIL_ALREADY_REGISTERED_MESSAGE = 'Email already registered.'

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

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsedCredentials.email!,
    password: parsedCredentials.password!,
  })

  if (error) {
    return mapSupabaseAuthError(error.message)
  }

  revalidatePath('/', 'layout')
  redirect('/inventory')
}

const signUpWithPassword = async (
  formData: FormData,
): Promise<AuthActionError> => {
  const parsedCredentials = getParsedCredentials(formData)

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

  revalidatePath('/', 'layout')
  redirect('/inventory')
}

const signOut = async () => {
  const supabase = await createClient()
  await supabase.auth.signOut()

  revalidatePath('/', 'layout')
  redirect('/')
}

export { signInWithPassword, signUpWithPassword, signOut }
