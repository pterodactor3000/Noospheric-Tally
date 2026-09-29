import { Button } from '@/components/ui/button'
import {
  fieldControl,
  fieldLabel,
  fieldStack,
  formError,
  formStack,
  fullWidthButton,
  pageLead,
  pageTitle,
} from '@/app/styles/class-names'
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
          <Label
            htmlFor="barcode"
            className={fieldLabel}
          >
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
            className={fieldControl}
          />
        </div>
        <div
          role="alert"
          aria-live="polite"
          className={formError}
        >
          {errorMessage}
        </div>
        <Button
          variant="outline"
          type="submit"
          className={fullWidthButton}
        >
          Apply
        </Button>
      </form>
    </>
  )
}

export { BarcodeLookupForm }
