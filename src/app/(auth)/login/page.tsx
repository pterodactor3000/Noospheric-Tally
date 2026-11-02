'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import {
  fieldStack,
  footnote,
  formStack,
  pageLead,
  pageTitle,
} from '@/app/styles/class-names'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TextLink } from '@/components/ui/text-link'

import { FormAlert } from '@/components/ui/form-alert'

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
          <Label htmlFor="email">
            Email
          </Label>
          <Input
            type="email"
            name="email"
            id="email"
            autoComplete="email"
            aria-invalid={state?.field === 'email'}
          />
        </div>

        <div className={fieldStack}>
          <Label htmlFor="password">
            Password
          </Label>
          <Input
            type="password"
            name="password"
            id="password"
            autoComplete="current-password"
            aria-invalid={state?.field === 'password'}
          />
        </div>

        <FormAlert message={state?.status === 'error' ? state.message : null}>
          <Button
            variant="outline"
            type="submit"
            disabled={isPending}
            size="touch"
          >
            Sign in
          </Button>
        </FormAlert>
      </form>

      <p className={footnote}>
        No personal cogitation unit?{' '}
        <TextLink href="/signup">
          Requisite one
        </TextLink>
      </p>
    </>
  )
}

export default Login
