'use client'

import { useActionState } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  fieldControl,
  fieldLabel,
  fieldStack,
  footnote,
  formError,
  formStack,
  fullWidthButton,
  pageLead,
  pageTitle,
  textLink,
} from '@/app/styles/class-names'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { signInWithPassword } from '../actions'

type AuthFormState = {
  status: 'error' | 'success' | 'pending'
  message: string
  field?: 'email' | 'password'
} | null

const Login = () => {
  const [state, formAction, isPending] = useActionState(
    async (_prev: AuthFormState, formData: FormData) =>
      signInWithPassword(formData),
    null,
  )

  return (
    <>
      <h1 className={pageTitle}>
        Cogitation unit login
      </h1>
      <p className={pageLead}>
        Provide credentials to use your personal cogitation unit.
      </p>

      <form
        action={formAction}
        className={formStack}
      >
        <div className={fieldStack}>
          <Label
            htmlFor="email"
            className={fieldLabel}
          >
            Email
          </Label>
          <Input
            type="email"
            name="email"
            id="email"
            autoComplete="email"
            aria-invalid={state?.field === 'email'}
            className={fieldControl}
          />
        </div>

        <div className={fieldStack}>
          <Label
            htmlFor="password"
            className={fieldLabel}
          >
            Password
          </Label>
          <Input
            type="password"
            name="password"
            id="password"
            autoComplete="current-password"
            aria-invalid={state?.field === 'password'}
            className={fieldControl}
          />
        </div>

        <div
          role="alert"
          aria-live="polite"
          className={formError}
        >
          {state?.status === 'error' && state?.message}
        </div>

        <Button
          variant="outline"
          type="submit"
          disabled={isPending}
          className={fullWidthButton}
        >
          Sign in
        </Button>
      </form>

      <p className={footnote}>
        No personal cogitation unit?{' '}
        <Link href="/signup" className={textLink}>
          Requisite one
        </Link>
      </p>
    </>
  )
}

export default Login
