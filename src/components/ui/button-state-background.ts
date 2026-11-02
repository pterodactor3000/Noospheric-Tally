import { clsx } from 'clsx'

const buttonStateBackground = clsx(
  'hover:not-aria-pressed:not-aria-checked:bg-current/40',
  'focus-visible:not-aria-pressed:not-aria-checked:bg-current/40',
  'active:not-aria-pressed:not-aria-checked:bg-current/60',
  'aria-pressed:bg-button',
  'aria-pressed:text-background',
  'aria-checked:bg-button',
  'aria-checked:text-background',
)

export { buttonStateBackground }
