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
    'border',
    'border-2',
    'bg-clip-padding',
    'text-sm',
    'font-medium',
    'whitespace-nowrap',
    'transition-all',
    'outline-none',
    'select-none',
    'focus-visible:border-ring',
    'focus-visible:ring-3',
    'focus-visible:ring-ring/50',
    'active:not-aria-[haspopup]:translate-y-px',
    'disabled:pointer-events-none',
    'disabled:opacity-50',
    'aria-invalid:border-destructive',
    'aria-invalid:ring-3',
    'aria-invalid:ring-destructive/20',
    'dark:aria-invalid:border-destructive/50',
    'dark:aria-invalid:ring-destructive/40',
    '[&_svg]:pointer-events-none',
    '[&_svg]:shrink-0',
    "[&_svg:not([class*='size-'])]:size-4",
  ),
  {
    variants: {
      variant: {
        default: clsx(
          'bg-foreground',
          'text-background',
          'hover:bg-primary/80',
        ),
        outline: clsx(
          'border-border',
          'bg-background',
          'hover:bg-green-800/10',
          'hover:text-foreground',
          'aria-expanded:bg-green-800/10',
          'aria-expanded:text-foreground',
          'dark:border-input',
          'dark:bg-input/30',
          'dark:hover:bg-green-800/20',
        ),
        secondary: clsx(
          'bg-green-800',
          'text-foreground',
          'border-0',
          'hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]',
          'aria-expanded:bg-secondary',
          'aria-expanded:text-secondary-foreground',
        ),
        ghost: clsx(
          'bg-transparent',
          'border-0',
          'hover:bg-green-800/5',
          'hover:text-green-700',
          'aria-expanded:bg-green-800/10',
          'aria-expanded:text-green-800',
          'dark:hover:bg-green-800/5',
        ),
        destructive: clsx(
          'bg-red-700/10',
          'text-red-700',
          'border-red-700',
          'hover:bg-red-700/10',
          'focus-visible:border-red-700/30',
          'focus-visible:ring-red-700/10',
          'dark:bg-red-700/10',
          'dark:hover:bg-red-700/20',
          'dark:focus-visible:ring-red-700/30',
        ),
        link: clsx('text-primary', 'underline-offset-4', 'hover:underline'),
      },
      size: {
        default: clsx(
          'h-8',
          'gap-1.5',
          'px-2.5',
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
          'has-data-[icon=inline-end]:pr-2',
          'has-data-[icon=inline-start]:pl-2',
        ),
        icon: clsx('size-8'),
        'icon-xs': clsx(
          'size-6',
          'rounded-[min(var(--radius-md),10px)]',
          'in-data-[slot=button-group]:rounded-lg',
          "[&_svg:not([class*='size-'])]:size-3",
        ),
        'icon-sm': clsx(
          'size-7',
          'rounded-[min(var(--radius-md),12px)]',
          'in-data-[slot=button-group]:rounded-lg',
        ),
        'icon-lg': clsx('size-9'),
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
