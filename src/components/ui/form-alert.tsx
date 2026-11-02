import type { ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'

const formErrorVariants = cva(
  clsx(
    'min-h-6',
    'text-sm',
    'text-destructive',
    'font-semibold',
    'motion-safe:animate-form-alert-in',
  ),
  {
    variants: {
      spacing: {
        none: '',
        bottom: 'pb-4',
        top: 'pt-4',
      },
    },
    defaultVariants: {
      spacing: 'none',
    },
  },
)

const alertSlot = clsx(
  'grid',
  'transition-[grid-template-rows]',
  'duration-500',
  'ease-in-out',
  'motion-reduce:transition-none',
)

interface FormErrorProps extends VariantProps<typeof formErrorVariants> {
  readonly id?: string
  readonly children: ReactNode
}

interface FormAlertProps {
  readonly id?: string
  readonly message: string | null
  readonly alertSpacing?: 'bottom' | 'top'
  readonly children: ReactNode
}

function FormError({ id, spacing, children }: FormErrorProps) {
  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className={formErrorVariants({ spacing })}
    >
      {children}
    </div>
  )
}

function FormAlert({
  id,
  message,
  alertSpacing = 'bottom',
  children,
}: FormAlertProps) {
  const isVisible = message !== null && message.length > 0

  return (
    <div className={clsx('flex', 'flex-col')}>
      <div
        className={clsx(
          alertSlot,
          isVisible ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className={clsx('min-h-0', 'overflow-hidden')}>
          {isVisible ? (
            <FormError id={id} spacing={alertSpacing}>
              {message}
            </FormError>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  )
}

export { FormAlert, FormError }
