import { clsx } from 'clsx'

import { Button } from '@/components/ui/button'
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
      <h1
        className={clsx(
          'font-mono',
          'uppercase',
          'text-balance',
          'text-4xl',
          'font-semibold',
          'tracking-tight',
          'sm:text-5xl',
        )}
      >
        Item data creation
      </h1>
      <p
        className={clsx(
          'font-mono',
          'mt-6',
          'text-pretty',
          'text-foreground/70',
          'leading-7',
          'text-base',
        )}
      >
        Provide the barcode
      </p>
      <form
        action="/inventory/new"
        method="get"
        className={clsx('mt-8', 'flex', 'flex-col', 'gap-4')}
      >
        <div className={clsx('flex', 'flex-col', 'gap-2')}>
          <Label
            htmlFor="barcode"
            className={clsx('text-sm', 'font-medium', 'font-mono')}
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
            className={clsx('min-h-11', 'text-base', 'font-mono')}
          />
        </div>
        <div
          role="alert"
          aria-live="polite"
          className={clsx(
            'min-h-6',
            'text-sm',
            'text-red-700',
            'font-mono',
            'font-semibold',
          )}
        >
          {errorMessage}
        </div>
        <Button
          variant="outline"
          type="submit"
          className={clsx('font-mono', 'min-h-11', 'w-full')}
        >
          Apply
        </Button>
      </form>
    </>
  )
}

export { BarcodeLookupForm }
