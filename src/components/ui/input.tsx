'use client'

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type Ref,
} from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'

import { clsx } from 'clsx'

import { getInputMirrorText } from '@/lib/inputs/get-input-mirror-text'
import { isBracketInputType } from '@/lib/inputs/is-bracket-input-type'

import { DotLeader } from './dot-leader'
import { TerminalCaret } from './terminal-caret'

type InputProps = ComponentProps<'input'>

type FileInputProps = Omit<InputProps, 'type' | 'value' | 'defaultValue'>

interface InputFrameProps {
  readonly className?: string
  readonly children: ReactNode
}

interface InputTrackProps {
  readonly children: ReactNode
}

interface PasswordMaskProps {
  readonly value: string
}

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

const inputFrameClassName = clsx(
  'group/input',
  'bracket-frame',
  '[--bracket-arm:calc(0.4em+2px)]',
  'relative',
  'flex',
  'w-full',
  'min-w-0',
  'h-11',
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

const fileInputClassName = clsx(
  'absolute',
  'inset-0',
  'z-10',
  'size-full',
  'cursor-pointer',
  'opacity-0',
  'outline-none',
)

const inputTrackClassName = clsx(
  'pointer-events-none',
  'absolute',
  'inset-y-0',
  'left-3',
  'right-3',
  'flex',
  'items-center',
  'overflow-hidden',
)

const inputTextClassName = clsx(
  'min-w-0',
  'shrink',
  'overflow-hidden',
  'whitespace-pre',
)

const passwordMaskBlock = clsx(
  'inline-block',
  'h-[1.25em]',
  'w-0',
  'shrink-0',
  'border-r-[calc(1ch-2px)]',
  'border-foreground',
  'mr-[2px]',
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
  inputValue: InputProps['value'] | InputProps['defaultValue'],
): string => String(inputValue ?? '')

const readSelectedFileNames = (input: HTMLInputElement): string =>
  Array.from(input.files ?? [], (file) => file.name).join(', ')

const withoutInputValue = (
  props: Omit<InputProps, 'className' | 'type'>,
): Omit<FileInputProps, 'className'> => {
  const fileProps = { ...props }
  delete fileProps.value
  delete fileProps.defaultValue
  return fileProps
}

const useInputBinding = (
  ref: Ref<HTMLInputElement> | undefined,
  syncFromInput: (input: HTMLInputElement) => void,
) => {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const forwardedRef = useRef(ref)
  const onSync = useEffectEvent(syncFromInput)

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

    onSync(input)

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

        onSync(currentInput)
      }, 0)
    }

    form?.addEventListener('reset', handleReset)

    return () => {
      form?.removeEventListener('reset', handleReset)
      clearTimeout(resetTimerId)
    }
  }, [])

  return bindInput
}

function InputFrame({ className, children }: InputFrameProps) {
  return (
    <span
      data-slot="input-frame"
      className={clsx(inputFrameClassName, className)}
    >
      {children}
    </span>
  )
}

function InputTrack({ children }: InputTrackProps) {
  return (
    <span aria-hidden="true" className={inputTrackClassName}>
      {children}
      <TerminalCaret visibility="input-focus" data-slot="input-caret" />
      <DotLeader tone="muted" data-slot="input-dots" />
    </span>
  )
}

function PasswordMask({ value }: PasswordMaskProps) {
  return (
    <span className={clsx('flex', 'min-w-0', 'shrink', 'overflow-hidden')}>
      {Array.from(value).map((_, index) => (
        <span
          key={index}
          data-slot="input-password-block"
          className={passwordMaskBlock}
        />
      ))}
    </span>
  )
}

function BracketInput({
  className,
  type,
  ref,
  value,
  defaultValue,
  onInput,
  ...props
}: InputProps) {
  const [trackedValue, setTrackedValue] = useState(() =>
    String(value ?? defaultValue ?? ''),
  )
  const isControlled = value !== undefined
  const mirrorValue = isControlled ? readInputText(value) : trackedValue
  const bindInput = useInputBinding(ref, (input) => {
    setTrackedValue(input.value)
  })

  const handleInput: NonNullable<InputProps['onInput']> = (event) => {
    if (!isControlled) {
      setTrackedValue(event.currentTarget.value)
    }

    onInput?.(event)
  }

  return (
    <InputFrame className={className}>
      <InputPrimitive
        {...props}
        type={type}
        ref={bindInput}
        {...(isControlled ? { value } : { defaultValue })}
        onInput={handleInput}
        data-slot="input"
        className={clsx(
          framedInputClassName,
          type === 'password' && 'text-transparent',
        )}
      />
      <InputTrack>
        {type === 'password' ? (
          <PasswordMask value={mirrorValue} />
        ) : (
          <span
            data-slot="input-mirror"
            className={clsx('invisible', inputTextClassName)}
          >
            {getInputMirrorText(mirrorValue, type)}
          </span>
        )}
      </InputTrack>
    </InputFrame>
  )
}

function FileBracketInput({
  className,
  ref,
  onChange,
  ...props
}: FileInputProps) {
  const [fileName, setFileName] = useState('')
  const bindInput = useInputBinding(ref, (input) => {
    setFileName(readSelectedFileNames(input))
  })

  const handleChange: NonNullable<InputProps['onChange']> = (event) => {
    setFileName(readSelectedFileNames(event.currentTarget))
    onChange?.(event)
  }

  return (
    <InputFrame className={className}>
      <InputPrimitive
        {...props}
        type="file"
        ref={bindInput}
        onChange={handleChange}
        data-slot="input"
        className={fileInputClassName}
      />
      <InputTrack>
        <span data-slot="input-file-name" className={inputTextClassName}>
          {fileName}
        </span>
      </InputTrack>
    </InputFrame>
  )
}

function Input({ className, type, ...props }: InputProps) {
  if (type === 'file') {
    return (
      <FileBracketInput className={className} {...withoutInputValue(props)} />
    )
  }

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
