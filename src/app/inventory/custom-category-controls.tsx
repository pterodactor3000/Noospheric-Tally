'use client'

import { useActionState, useState } from 'react'
import { clsx } from 'clsx'

import { Button } from '@/components/ui/button'
import { FormAlert } from '@/components/ui/form-alert'
import { Input } from '@/components/ui/input'

import { renameCategory } from './category-actions'

interface CustomCategoryControlsProps {
  readonly categoryId: string
  readonly name: string
}

interface RenameCategoryFormProps extends CustomCategoryControlsProps {
  readonly onClose: () => void
}

type RenameCategoryFormState = Awaited<ReturnType<typeof renameCategory>> | null

const renameFormClassName = clsx(
  'flex',
  'w-56',
  'max-w-full',
  'shrink-0',
  'flex-col',
  'gap-2',
)

const RenameCategoryForm = ({
  categoryId,
  name,
  onClose,
}: RenameCategoryFormProps) => {
  const [draftName, setDraftName] = useState(name)
  const [state, formAction, isPending] = useActionState(
    async (_previous: RenameCategoryFormState, formData: FormData) => {
      const result = await renameCategory(formData)
      if (result.status === 'saved') {
        onClose()
      }
      return result
    },
    null,
  )
  const nameInputId = `rename-category-${categoryId}`
  const nameErrorId = `rename-category-${categoryId}-error`
  const isNameInvalid = state?.status === 'error' && state.field === 'name'

  return (
    <form action={formAction} className={renameFormClassName}>
      <input type="hidden" name="categoryId" value={categoryId} />
      <Input
        type="text"
        name="name"
        id={nameInputId}
        autoComplete="off"
        maxLength={40}
        value={draftName}
        aria-label="Category name"
        onChange={(event) => {
          setDraftName(event.currentTarget.value)
        }}
        aria-invalid={isNameInvalid}
        aria-describedby={isNameInvalid ? nameErrorId : undefined}
      />
      <FormAlert
        id={nameErrorId}
        message={state?.status === 'error' ? state.message : null}
      >
        <div className={clsx('flex', 'gap-2')}>
          <Button
            variant="outline"
            type="submit"
            disabled={isPending}
            size="sm"
          >
            Save
          </Button>
          <Button
            variant="outline"
            type="button"
            size="sm"
            disabled={isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </FormAlert>
    </form>
  )
}

const CustomCategoryControls = ({
  categoryId,
  name,
}: CustomCategoryControlsProps) => {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label={`Rename ${name}`}
        onClick={() => {
          setIsOpen(true)
        }}
      >
        Rename
      </Button>
    )
  }

  return (
    <RenameCategoryForm
      categoryId={categoryId}
      name={name}
      onClose={() => {
        setIsOpen(false)
      }}
    />
  )
}

export { CustomCategoryControls }
