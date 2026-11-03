'use client'

import { useActionState, useState } from 'react'

import { fieldStack, formFields } from '@/app/styles/class-names'
import { Button } from '@/components/ui/button'
import { Disclosure } from '@/components/ui/disclosure'
import { FormAlert } from '@/components/ui/form-alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { createCategory } from './category-actions'

type CreateCategoryFormState = Awaited<ReturnType<typeof createCategory>> | null

const CATEGORY_NAME_ERROR_ID = 'category-name-error'

const getSubmittedName = (formData: FormData): string => {
  const value = formData.get('name')
  return typeof value === 'string' ? value : ''
}

const CreateCategoryForm = () => {
  const [name, setName] = useState('')
  const [state, formAction, isPending] = useActionState(
    async (_previous: CreateCategoryFormState, formData: FormData) => {
      const submittedName = getSubmittedName(formData)
      const result = await createCategory(formData)
      setName((currentName) => {
        if (currentName !== submittedName) {
          return currentName
        }

        return result.status === 'saved' ? '' : submittedName
      })
      return result
    },
    null,
  )

  const isNameInvalid = state?.status === 'error' && state.field === 'name'

  return (
    <Disclosure title="Add a category" contentId="create-category">
      <form action={formAction} className={formFields}>
        <div className={fieldStack}>
          <Label htmlFor="category-name">Category name</Label>
          <Input
            type="text"
            name="name"
            id="category-name"
            autoComplete="off"
            maxLength={40}
            value={name}
            onChange={(event) => {
              setName(event.currentTarget.value)
            }}
            aria-invalid={isNameInvalid}
            aria-describedby={isNameInvalid ? CATEGORY_NAME_ERROR_ID : undefined}
          />
        </div>
        <FormAlert
          id={CATEGORY_NAME_ERROR_ID}
          message={state?.status === 'error' ? state.message : null}
        >
          <Button
            variant="outline"
            type="submit"
            disabled={isPending}
            size="touch"
          >
            Add category
          </Button>
        </FormAlert>
      </form>
    </Disclosure>
  )
}

export { CreateCategoryForm }
