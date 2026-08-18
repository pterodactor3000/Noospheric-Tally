'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { clsx } from 'clsx'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { signUpWithPassword } from '../actions'

type AuthFormState = {
  status: 'error' | 'success' | 'pending'
  message: string
  field?: 'email' | 'password'
} | null

const Signup = () => {
  const [state, formAction, isPending] = useActionState(
    async (_prev: AuthFormState, formData: FormData) =>
      signUpWithPassword(formData),
    null,
  )

  return (
    <>
      <h1
        className={clsx(
          'font-mono',
          'uppercase',
          'text-balance',
          'text-4xl',
          'font-semibold',
          'tracking-tight',
          'sm:text-5xl',
        )}
      >
        Cogitation unit requisition
      </h1>
      <p
        className={clsx(
          'font-mono',
          'uppercase',
          'mt-6',
          'text-pretty',
          'text-foreground/70',
          'leading-7',
          'text-base',
        )}
      >
        Provide credentials to requisition your personal cogitation unit
      </p>

      <form
        action={formAction}
        className={clsx('mt-8', 'flex', 'flex-col', 'gap-4')}
      >
        <div className={clsx('flex', 'flex-col', 'gap-2')}>
          <Label
            htmlFor="email"
            className={clsx('text-sm', 'font-medium', 'font-mono', 'uppercase')}
          >
            Email
          </Label>
          <Input
            type="email"
            name="email"
            id="email"
            autoComplete="email"
            aria-invalid={state?.field === 'email'}
            className={clsx('min-h-11', 'text-base', 'font-mono', 'uppercase')}
          />
        </div>

        <div className={clsx('flex', 'flex-col', 'gap-2')}>
          <Label
            htmlFor="password"
            className={clsx('text-sm', 'font-medium', 'font-mono', 'uppercase')}
          >
            Password
          </Label>
          <Input
            type="password"
            name="password"
            id="password"
            autoComplete="new-password"
            aria-invalid={state?.field === 'password'}
            className={clsx('min-h-11', 'text-base', 'font-mono', 'uppercase')}
          />
        </div>

        <div
          role="alert"
          aria-live="polite"
          className={clsx(
            'min-h-6',
            'text-sm',
            'text-red-700',
            'font-mono',
            'uppercase',
            'font-semibold',
          )}
        >
          {state?.status === 'error' && state?.message}
        </div>

        <Button
          variant="outline"
          type="submit"
          disabled={isPending}
          className={clsx('font-mono', 'uppercase', 'min-h-11', 'w-full')}
        >
          Sign up
        </Button>
      </form>

      <p
        className={clsx(
          'mt-6',
          'text-sm',
          'text-foreground/70',
          'font-mono',
          'uppercase',
        )}
      >
        Cogitation unit already requisitioned?{' '}
        <Link
          href="/login"
          className={clsx(
            'font-medium',
            'text-foreground',
            'underline-offset-4',
            'hover:underline',
            'font-mono',
            'uppercase',
          )}
        >
          Enter credentials
        </Link>
      </p>
    </>
  )
}

export default Signup
