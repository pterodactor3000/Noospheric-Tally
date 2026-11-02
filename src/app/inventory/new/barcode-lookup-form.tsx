import { Button } from '@/components/ui/button'
import {
  fieldStack,
  formStack,
  pageLead,
  pageTitle,
} from '@/app/styles/class-names'
import { FormAlert } from '@/components/ui/form-alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface BarcodeLookupFormProps {
  defaultBarcode: string
  errorMessage?: string
}

const BarcodeLookupForm = ({
  defaultBarcode,
  errorMessage,
}: BarcodeLookupFormProps) => {
  return (
    <>
      <h1 className={pageTitle}>
        Item data creation
      </h1>
      <p className={pageLead}>
        Provide the barcode
      </p>
      <form
        action="/inventory/new"
        method="get"
        className={formStack}
      >
        <div className={fieldStack}>
          <Label htmlFor="barcode">
            Barcode
          </Label>
          <Input
            type="text"
            id="barcode"
            name="barcode"
            inputMode="numeric"
            autoComplete="off"
            required
            defaultValue={defaultBarcode}
            aria-invalid={Boolean(errorMessage)}
          />
        </div>
        <FormAlert message={errorMessage ?? null}>
          <Button
            variant="outline"
            type="submit"
            size="touch"
          >
            Apply
          </Button>
        </FormAlert>
      </form>
    </>
  )
}

export { BarcodeLookupForm }
