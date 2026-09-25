import { clsx } from 'clsx'

const pageShell = clsx(
  'flex',
  'min-h-screen',
  'items-center',
  'bg-background',
  'px-6',
  'py-12',
  'text-foreground',
  'sm:px-10',
)

const centeredPage = clsx(
  'flex',
  'flex-col',
  'min-h-screen',
  'items-center',
  'justify-center',
  'px-6',
)

const contentWidth = clsx('mx-auto', 'w-full', 'max-w-4xl')

const panel = clsx(
  'border',
  'border-foreground/50',
  'p-8',
  'shadow-sm',
  'backdrop-blur',
  'sm:p-12',
  'dark:bg-black/20',
)

const pageTitle = clsx(
  'font-mono',
  'uppercase',
  'text-balance',
  'text-4xl',
  'font-semibold',
  'tracking-tight',
  'sm:text-5xl',
)

const pageLead = clsx(
  'font-mono',
  'mt-6',
  'text-pretty',
  'text-foreground/70',
  'leading-7',
  'text-base',
)

const sectionHeading = clsx(
  'font-mono',
  'font-semibold',
  'tracking-[0.18em]',
  'text-foreground/70',
  'uppercase',
)

const sectionCopy = clsx(
  'mt-2',
  'text-sm',
  'leading-6',
  'text-foreground/70',
  'font-mono',
)

const footnote = clsx('mt-6', 'text-sm', 'text-foreground/70', 'font-mono')

const textLink = clsx(
  'font-medium',
  'text-foreground',
  'underline-offset-4',
  'hover:underline',
  'font-mono',
)

const formStack = clsx('mt-8', 'flex', 'flex-col', 'gap-4')

const fieldStack = clsx('flex', 'flex-col', 'gap-2')

const fieldLabel = clsx('text-sm', 'font-medium', 'font-mono')

const fieldControl = clsx('min-h-11', 'text-base', 'font-mono')

const formError = clsx(
  'min-h-6',
  'text-sm',
  'text-red-700',
  'font-mono',
  'font-semibold',
)

const actionButton = clsx('font-mono', 'min-h-11')

const fullWidthButton = clsx(actionButton, 'w-full')

export {
  actionButton,
  centeredPage,
  contentWidth,
  fieldControl,
  fieldLabel,
  fieldStack,
  footnote,
  formError,
  formStack,
  fullWidthButton,
  pageLead,
  pageShell,
  pageTitle,
  panel,
  sectionCopy,
  sectionHeading,
  textLink,
}
