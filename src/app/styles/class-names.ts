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

const formFields = clsx('flex', 'flex-col', 'gap-4')

const formStack = clsx('mt-8', formFields)

const fieldStack = clsx('flex', 'flex-col', 'gap-2')

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

export {
  centeredPage,
  contentWidth,
  categoryTree,
  categoryTreeItem,
  fieldStack,
  footnote,
  formFields,
  formStack,
  pageLead,
  pageShell,
  pageTitle,
  sectionCopy,
  sectionHeading,
}
