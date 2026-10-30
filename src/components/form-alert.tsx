import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { formError } from '@/app/styles/class-names'

interface FormAlertProps {
  readonly message: string | null
  readonly alertClassName?: string
  readonly children: ReactNode
}

const alertSlot = clsx(
  'grid',
  'transition-[grid-template-rows]',
  'duration-500',
  'ease-in-out',
  'motion-reduce:transition-none',
)

const FormAlert = ({ message, alertClassName, children }: FormAlertProps) => {
  const isVisible = message !== null && message.length > 0

  return (
    <div>
      <div
        className={clsx(
          alertSlot,
          isVisible ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          {isVisible ? (
            <div
              role="alert"
              aria-live="polite"
              className={clsx(formError, alertClassName ?? 'pb-4')}
            >
              {message}
            </div>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  )
}

export { FormAlert }
