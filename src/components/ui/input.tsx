'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type Ref,
} from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'

import { clsx } from 'clsx'

import { passwordMaskBlock, terminalCaret } from '@/app/styles/class-names'
import { getInputMirrorText } from '@/lib/inputs/get-input-mirror-text'
import { isBracketInputType } from '@/lib/inputs/is-bracket-input-type'

const INPUT_DOT_TRACK = '.'.repeat(300)

const plainInputClassName = clsx(
  'h-8',
  'w-full',
  'min-w-0',
  'rounded-lg',
  'border-2',
  'border-input',
  'bg-transparent',
  'px-2.5',
  'py-1',
  'text-base',
  'transition-colors',
  'outline-none',
  'file:inline-flex',
  'file:h-6',
  'file:border-0',
  'file:bg-transparent',
  'file:text-sm',
  'file:font-medium',
  'file:text-foreground',
  'placeholder:text-muted-foreground',
  'focus-visible:border-ring',
  'focus-visible:ring-3',
  'focus-visible:ring-ring/50',
  'disabled:pointer-events-none',
  'disabled:cursor-not-allowed',
  'disabled:bg-input/50',
  'disabled:opacity-50',
  'aria-invalid:border-destructive',
  'aria-invalid:ring-3',
  'aria-invalid:ring-destructive/20',
  'focus-visible:aria-invalid:border-destructive',
  'md:text-sm',
  'dark:bg-input/30',
  'dark:disabled:bg-input/80',
  'dark:aria-invalid:border-destructive',
  'dark:aria-invalid:ring-destructive/40',
  'dark:focus-visible:aria-invalid:border-destructive',
)

const framedInputClassName = clsx(
  'w-full',
  'min-w-0',
  'self-stretch',
  'border-0',
  'bg-transparent',
  'px-3',
  'text-[length:inherit]',
  'font-[inherit]',
  'outline-none',
  'placeholder:text-transparent',
  'caret-transparent',
  '[&::-webkit-search-cancel-button]:hidden',
  '[&::-webkit-search-decoration]:hidden',
  '[&::-ms-reveal]:hidden',
)

const assignInputRef = (
  ref: Ref<HTMLInputElement> | undefined,
  node: HTMLInputElement | null,
): void => {
  if (typeof ref === 'function') {
    ref(node)
    return
  }

  if (ref === null || ref === undefined) {
    return
  }

  ref.current = node
}

const readInputText = (
  inputValue: ComponentProps<'input'>['value'] | ComponentProps<'input'>['defaultValue'],
): string => String(inputValue ?? '')

function BracketInput({
  className,
  type,
  ref,
  value,
  defaultValue,
  onChange,
  onInput,
  ...props
}: ComponentProps<'input'>) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const forwardedRef = useRef(ref)
  const [trackedValue, setTrackedValue] = useState(() =>
    String(value ?? defaultValue ?? ''),
  )
  const isControlled = value !== undefined
  const mirrorValue = isControlled ? readInputText(value) : trackedValue

  const bindInput = useCallback((node: HTMLElement | null): void => {
    const input = node instanceof HTMLInputElement ? node : null
    inputRef.current = input
    assignInputRef(forwardedRef.current, input)
  }, [])

  useEffect(() => {
    const previousRef = forwardedRef.current
    forwardedRef.current = ref
    if (previousRef === ref) {
      return
    }

    assignInputRef(previousRef, null)
    assignInputRef(ref, inputRef.current)
  }, [ref])

  useEffect(() => {
    const input = inputRef.current
    if (input === null) {
      return
    }

    setTrackedValue(input.value)

    const form = input.form
    let resetTimerId: ReturnType<typeof setTimeout> | undefined

    const handleReset = (): void => {
      clearTimeout(resetTimerId)
      // reset fires before the browser restores each field.
      resetTimerId = setTimeout(() => {
        const currentInput = inputRef.current
        if (currentInput === null) {
          return
        }

        setTrackedValue(currentInput.value)
      }, 0)
    }

    form?.addEventListener('reset', handleReset)

    return () => {
      form?.removeEventListener('reset', handleReset)
      clearTimeout(resetTimerId)
    }
  }, [])

  const handleInput: NonNullable<ComponentProps<'input'>['onInput']> = (
    event,
  ) => {
    if (!isControlled) {
      setTrackedValue(event.currentTarget.value)
    }

    onInput?.(event)
  }

  return (
    <span
      data-slot="input-frame"
      className={clsx(
        'group/input',
        'bracket-frame',
        '[--bracket-arm:calc(0.4em+2px)]',
        'relative',
        'flex',
        'w-full',
        'min-w-0',
        'h-8',
        'text-base',
        'md:text-sm',
        '[--bracket-color:var(--color-button)]',
        'focus-within:[--bracket-color:var(--color-ring)]',
        'has-[input:focus-visible]:[--bracket-color:var(--color-ring)]',
        'has-[input[aria-invalid=true]]:[--bracket-color:var(--color-destructive)]',
        'dark:has-[input[aria-invalid=true]]:[--bracket-color:color-mix(in_oklab,var(--color-destructive)_50%,transparent)]',
        'has-[input:focus-visible]:ring-3',
        'has-[input:focus-visible]:ring-ring/50',
        'has-[input[aria-invalid=true]]:ring-3',
        'has-[input[aria-invalid=true]]:ring-destructive/20',
        'dark:has-[input[aria-invalid=true]]:ring-destructive/40',
        'has-disabled:pointer-events-none',
        'has-disabled:cursor-not-allowed',
        'has-disabled:opacity-50',
        className,
      )}
    >
      <InputPrimitive
        {...props}
        type={type}
        ref={bindInput}
        {...(isControlled ? { value } : { defaultValue })}
        onChange={onChange}
        onInput={handleInput}
        data-slot="input"
        className={clsx(
          framedInputClassName,
          type === 'password' && 'text-transparent',
        )}
      />
      <span
        aria-hidden="true"
        className={clsx(
          'pointer-events-none',
          'absolute',
          'inset-y-0',
          'left-3',
          'right-3',
          'flex',
          'items-center',
          'overflow-hidden',
        )}
      >
        {type === 'password'
          ? (
              <span className={clsx('flex', 'min-w-0', 'shrink', 'overflow-hidden')}>
                {Array.from(mirrorValue).map((_, index) => (
                  <span
                    key={index}
                    data-slot="input-password-block"
                    className={passwordMaskBlock}
                  />
                ))}
              </span>
            )
          : (
              <span
                data-slot="input-mirror"
                className={clsx(
                  'invisible',
                  'min-w-0',
                  'shrink',
                  'overflow-hidden',
                  'whitespace-pre',
                )}
              >
                {getInputMirrorText(mirrorValue, type)}
              </span>
            )}
        <span
          data-slot="input-caret"
          className={clsx(
            'hidden',
            'shrink-0',
            'group-focus-within/input:block',
            'h-[1.25em]',
            terminalCaret,
          )}
        />
        <span
          data-slot="input-dots"
          className={clsx(
            'min-w-0',
            'flex-1',
            'overflow-hidden',
            'whitespace-nowrap',
            'text-muted-foreground',
          )}
        >
          {INPUT_DOT_TRACK}
        </span>
      </span>
    </span>
  )
}

function Input({ className, type, ...props }: ComponentProps<'input'>) {
  if (!isBracketInputType(type)) {
    return (
      <InputPrimitive
        type={type}
        data-slot="input"
        className={clsx(plainInputClassName, className)}
        {...props}
      />
    )
  }

  return <BracketInput className={className} type={type} {...props} />
}

export { Input }
