'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Disclosure } from '@/components/ui/disclosure'
import { FormAlert } from '@/components/ui/form-alert'
import { fieldStack, formFields } from '@/app/styles/class-names'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { createItemsFromJsonFile } from '../actions'

type BulkInsertFormState =
  Awaited<ReturnType<typeof createItemsFromJsonFile>> | null

const BulkInsertForm = () => {
  const [state, formAction, isPending] = useActionState(
    async (_previous: BulkInsertFormState, formData: FormData) =>
      createItemsFromJsonFile(formData),
    null,
  )

  return (
    <Disclosure title="Or add many items from a JSON file" contentId="bulk-insert">
      <form action={formAction} className={formFields}>
        <div className={fieldStack}>
          <Label htmlFor="bulk-insert-file">JSON file</Label>
          <Input
            type="file"
            name="file"
            id="bulk-insert-file"
            accept=".json,application/json"
          />
        </div>
        <FormAlert message={state?.status === 'error' ? state.message : null}>
          <Button
            variant="outline"
            type="submit"
            disabled={isPending}
            size="touch"
          >
            Add items from file
          </Button>
        </FormAlert>
      </form>
    </Disclosure>
  )
}

export { BulkInsertForm }
