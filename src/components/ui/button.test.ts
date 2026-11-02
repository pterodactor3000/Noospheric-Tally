import { describe, expect, test } from 'vitest'

import { buttonVariants } from './button'

const VARIANTS = [
  'default',
  'outline',
  'secondary',
  'ghost',
  'destructive',
  'link',
] as const

const SIZES = [
  'default',
  'xs',
  'sm',
  'lg',
  'touch',
  'glyph',
  'icon',
  'icon-xs',
  'icon-sm',
  'icon-lg',
  'icon-touch',
  'icon-xl',
] as const

const REMOVED_BORDER_COLOR_CLASSES = [
  'border-border',
  'dark:border-input',
  'focus-visible:border-ring',
  'aria-invalid:border-destructive',
  'dark:aria-invalid:border-destructive/50',
  'focus-visible:border-destructive/40',
] as const

const TINT_CLASSES = [
  'hover:bg-current/40',
  'focus-visible:bg-current/40',
  'active:bg-current/60',
] as const

const FONT_SIZE_CLASSES = [
  'text-xs',
  'text-sm',
  'text-base',
  'text-[0.8rem]',
] as const

const FONT_SIZE_BY_SIZE: Record<
  (typeof SIZES)[number],
  (typeof FONT_SIZE_CLASSES)[number]
> = {
  default: 'text-base',
  xs: 'text-xs',
  sm: 'text-[0.8rem]',
  lg: 'text-sm',
  touch: 'text-base',
  glyph: 'text-base',
  icon: 'text-sm',
  'icon-xs': 'text-sm',
  'icon-sm': 'text-sm',
  'icon-lg': 'text-sm',
  'icon-touch': 'text-sm',
  'icon-xl': 'text-sm',
}

const splitClasses = (className: string): string[] =>
  className.split(/\s+/).filter((token) => token.length > 0)

describe('buttonVariants', () => {
  test.each(
    VARIANTS.flatMap((variant) => SIZES.map((size) => ({ variant, size }))),
  )(
    'returns a bracket frame and one font size for the $variant variant at the $size size',
    ({ variant, size }) => {
      const classes = splitClasses(buttonVariants({ variant, size }))
      const fontSizeClasses = classes.filter((token) =>
        (FONT_SIZE_CLASSES as readonly string[]).includes(token),
      )
      const removedBorderColorClasses = REMOVED_BORDER_COLOR_CLASSES.filter(
        (token) => classes.includes(token),
      )
      const backgroundClasses = classes.filter(
        (token) =>
          /(^|:)bg-/.test(token) &&
          token !== 'bg-transparent' &&
          token !== 'bg-clip-padding' &&
          !(TINT_CLASSES as readonly string[]).includes(token),
      )

      expect({
        hasBracketFrame: classes.includes('bracket-frame'),
        hasLongerArms: classes.includes('[--bracket-arm:calc(0.4em+2px)]'),
        hasBorderColor: classes.includes('text-button'),
        tintClasses: TINT_CLASSES.filter((token) => classes.includes(token)),
        removedBorderColorClasses,
        backgroundClasses,
        fontSizeClasses,
      }).toEqual({
        hasBracketFrame: true,
        hasLongerArms: true,
        hasBorderColor: true,
        tintClasses: variant === 'link' ? [] : [...TINT_CLASSES],
        removedBorderColorClasses: [],
        backgroundClasses: [],
        fontSizeClasses: [FONT_SIZE_BY_SIZE[size]],
      })
    },
  )
})
