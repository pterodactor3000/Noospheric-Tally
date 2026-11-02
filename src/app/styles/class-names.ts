import { clsx } from 'clsx'

const pageShell = clsx(
  'flex',
  'w-full',
  'flex-1',
  'items-center',
  'bg-background',
  'px-6',
  'py-12',
  'text-foreground',
  'sm:px-10',
  'max-sm:items-start',
  'max-sm:pt-4',
)

const centeredPage = clsx(
  'flex',
  'w-full',
  'flex-1',
  'flex-col',
  'items-center',
  'justify-center',
  'px-6',
  'max-sm:justify-start',
  'max-sm:pt-4',
)

const contentWidth = clsx('mx-auto', 'w-full', 'max-w-4xl')

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
  'text-input',
  'underline-offset-4',
  'hover:bg-current/40',
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
  'text-destructive',
  'font-mono',
  'font-semibold',
  'motion-safe:animate-form-alert-in',
)

const actionButton = clsx('font-mono', 'min-h-11')

const countControlGroup = clsx(
  'inline-grid',
  'shrink-0',
  'grid-cols-[auto_auto_auto]',
  'items-center',
  'gap-x-2',
  'whitespace-nowrap',
)

const countBracketButton = clsx(
  'bracket-frame',
  'inline-flex',
  'h-[1.25em]',
  'w-auto',
  'min-h-0',
  'min-w-0',
  'shrink-0',
  'items-center',
  'justify-center',
  'border-0',
  'bg-transparent',
  'enabled:hover:bg-current/40',
  'enabled:active:bg-current/60',
  'transition-colors',
  'px-[0.6em]',
  'font-[inherit]',
  'text-[length:inherit]',
  'leading-none',
  'text-inherit',
  'no-underline',
  'disabled:text-inherit',
  'disabled:opacity-100',
)

const categoryTree = clsx('m-0', 'list-none', 'p-0')

const categoryTreeItem = clsx(
  'relative',
  'py-0',
  'pr-2',
  'pl-5',
  'before:absolute',
  'before:top-0',
  'before:bottom-0',
  'before:left-[4px]',
  'before:w-px',
  "before:content-['']",
  'before:bg-border',
  'before:shadow-[0_0_8px]',
  'before:shadow-primary/40',
  'after:absolute',
  'after:top-[18px]',
  'after:left-[4px]',
  'after:h-px',
  'after:w-[14px]',
  "after:content-['']",
  'after:bg-border',
  'after:shadow-[0_0_8px]',
  'after:shadow-primary/40',
  'last:before:bottom-auto',
  'last:before:h-[18px]',
)

const fullWidthButton = clsx(actionButton, 'w-full')

export {
  actionButton,
  centeredPage,
  contentWidth,
  categoryTree,
  categoryTreeItem,
  countBracketButton,
  countControlGroup,
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
  sectionCopy,
  sectionHeading,
  textLink,
}
