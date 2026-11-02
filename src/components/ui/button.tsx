import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx } from 'clsx'

const buttonVariants = cva(
  clsx(
    'group/button',
    'inline-flex',
    'shrink-0',
    'items-center',
    'justify-center',
    'rounded-lg',
    'border-2',
    'border-transparent',
    'bg-clip-padding',
    'bracket-frame',
    '[--bracket-color:currentColor]',
    'font-medium',
    'whitespace-nowrap',
    'transition-all',
    'outline-none',
    'select-none',
    'focus-visible:[--bracket-color:var(--color-ring)]',
    'focus-visible:ring-3',
    'focus-visible:ring-ring/50',
    'active:not-aria-[haspopup]:translate-y-px',
    'disabled:pointer-events-none',
    'disabled:opacity-50',
    'aria-invalid:[--bracket-color:var(--color-destructive)]',
    'aria-invalid:ring-3',
    'aria-invalid:ring-destructive/20',
    'dark:aria-invalid:[--bracket-color:color-mix(in_oklab,var(--color-destructive)_50%,transparent)]',
    'dark:aria-invalid:ring-destructive/40',
    '[&_svg]:pointer-events-none',
    '[&_svg]:shrink-0',
    "[&_svg:not([class*='size-'])]:size-4",
  ),
  {
    variants: {
      variant: {
        default: clsx(
          'bg-primary',
          'text-primary-foreground',
          'hover:bg-primary/80',
        ),
        outline: clsx(
          '[--bracket-color:var(--color-border)]',
          'bg-background',
          'hover:bg-muted',
          'hover:text-foreground',
          'aria-expanded:bg-muted',
          'aria-expanded:text-foreground',
          'dark:[--bracket-color:var(--color-input)]',
          'dark:bg-input/30',
          'dark:hover:bg-input/50',
        ),
        secondary: clsx(
          'bg-secondary',
          'text-secondary-foreground',
          'hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]',
          'aria-expanded:bg-secondary',
          'aria-expanded:text-secondary-foreground',
        ),
        ghost: clsx(
          'hover:bg-muted',
          'hover:text-foreground',
          'aria-expanded:bg-muted',
          'aria-expanded:text-foreground',
          'dark:hover:bg-muted/50',
        ),
        destructive: clsx(
          'bg-destructive/10',
          'text-destructive',
          'hover:bg-destructive/20',
          'focus-visible:[--bracket-color:color-mix(in_oklab,var(--color-destructive)_40%,transparent)]',
          'focus-visible:ring-destructive/20',
          'dark:bg-destructive/20',
          'dark:hover:bg-destructive/30',
          'dark:focus-visible:ring-destructive/40',
        ),
        link: clsx('text-primary', 'underline-offset-4', 'hover:underline'),
      },
      size: {
        default: clsx(
          'h-8',
          'gap-1.5',
          'px-2.5',
          'text-base',
          'has-data-[icon=inline-end]:pr-2',
          'has-data-[icon=inline-start]:pl-2',
        ),
        xs: clsx(
          'h-6',
          'gap-1',
          'rounded-[min(var(--radius-md),10px)]',
          'px-2',
          'text-xs',
          'in-data-[slot=button-group]:rounded-lg',
          'has-data-[icon=inline-end]:pr-1.5',
          'has-data-[icon=inline-start]:pl-1.5',
          "[&_svg:not([class*='size-'])]:size-3",
        ),
        sm: clsx(
          'h-7',
          'gap-1',
          'rounded-[min(var(--radius-md),12px)]',
          'px-2.5',
          'text-[0.8rem]',
          'in-data-[slot=button-group]:rounded-lg',
          'has-data-[icon=inline-end]:pr-1.5',
          'has-data-[icon=inline-start]:pl-1.5',
          "[&_svg:not([class*='size-'])]:size-3.5",
        ),
        lg: clsx(
          'h-9',
          'gap-1.5',
          'px-2.5',
          'text-sm',
          'has-data-[icon=inline-end]:pr-2',
          'has-data-[icon=inline-start]:pl-2',
        ),
        icon: clsx('size-8', 'text-sm'),
        'icon-xs': clsx(
          'size-6',
          'rounded-[min(var(--radius-md),10px)]',
          'text-sm',
          'in-data-[slot=button-group]:rounded-lg',
          "[&_svg:not([class*='size-'])]:size-3",
        ),
        'icon-sm': clsx(
          'size-7',
          'rounded-[min(var(--radius-md),12px)]',
          'text-sm',
          'in-data-[slot=button-group]:rounded-lg',
        ),
        'icon-lg': clsx('size-9', 'text-sm'),
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={clsx(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
